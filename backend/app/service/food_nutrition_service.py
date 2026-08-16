from pathlib import Path
import io
import json
import unicodedata

import torch
import torch.nn as nn
from fastapi import HTTPException, status
from openai import OpenAI
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

from app.config import settings
from app.schema.food_nutrition import NutritionAnalyzeResponse, NutritionInfo

BACKEND_ROOT = Path(__file__).resolve().parents[2]
SEEDS_PATH = BACKEND_ROOT / "seeds" / "nutrition_seeds.json"
CKPT_PATH = BACKEND_ROOT / "checkpoints" / "food_vlm.pt"
NUTRI_KEYS = ("calories", "protein", "fat", "carbohydrates")


def nfc(text: str) -> str:
    return unicodedata.normalize("NFC", text)


class FoodVLM(nn.Module):
    def __init__(self, clip: CLIPModel, num_classes: int):
        super().__init__()
        self.clip = clip
        hidden = clip.config.projection_dim
        self.class_head = nn.Linear(hidden, num_classes)
        self.nutrition_head = nn.Linear(hidden, len(NUTRI_KEYS))

    def forward(self, pixel_values: torch.Tensor):
        with torch.no_grad():
            outputs = self.clip.get_image_features(pixel_values=pixel_values)
            feat = outputs.pooler_output
        feat = feat / feat.norm(dim=-1, keepdim=True)
        return self.class_head(feat), self.nutrition_head(feat)


class FoodNutritionService:
    def __init__(self) -> None:
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        if self.device.type == "cuda":
            print(f"CLIP·heads GPU: {torch.cuda.get_device_name(0)}")
        else:
            print("CLIP·heads CPU")

        raw = json.loads(SEEDS_PATH.read_text(encoding="utf-8"))
        self.seeds = {nfc(k): v for k, v in raw.items()}

        ckpt = torch.load(CKPT_PATH, map_location=self.device, weights_only=False)
        clip_name = ckpt.get("clip_name", "openai/clip-vit-base-patch32")
        self.labels = [nfc(x) for x in ckpt["labels"]]

        self.processor = CLIPProcessor.from_pretrained(clip_name)
        clip = CLIPModel.from_pretrained(clip_name)
        self.model = FoodVLM(clip, num_classes=len(self.labels))
        self.model.class_head.load_state_dict(ckpt["class_head"])
        self.model.nutrition_head.load_state_dict(ckpt["nutrition_head"])
        self.model.to(self.device)
        self.model.eval()

        self.openai = OpenAI(api_key=settings.OPENAI_API_KEY)

    def analyze(self, image_bytes: bytes) -> NutritionAnalyzeResponse:
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미지 파일을 읽을 수 없습니다.",
            ) from exc

        pixels = self.processor(images=image, return_tensors="pt")["pixel_values"]
        pixels = pixels.to(self.device)

        with torch.no_grad():
            logits, nutri_pred = self.model(pixels)
            probs = torch.softmax(logits, dim=-1)[0]
            idx = int(probs.argmax().item())
            confidence = float(probs[idx].item())
            food = self.labels[idx]

        if food in self.seeds:
            nutrition = {k: float(self.seeds[food][k]) for k in NUTRI_KEYS}
        else:
            values = nutri_pred[0].tolist()
            nutrition = {
                k: float(max(0, round(v, 1)))
                for k, v in zip(NUTRI_KEYS, values)
            }

        answer = self._openai_answer(food, nutrition)
        return NutritionAnalyzeResponse(
            food=food,
            confidence=confidence,
            nutrition=NutritionInfo(**nutrition),
            answer=answer,
        )

    def _openai_answer(self, food: str, nutrition: dict) -> str:
        user = (
            f"음식: {food}\n"
            f"칼로리 {nutrition['calories']}kcal, "
            f"단백질 {nutrition['protein']}g, "
            f"지방 {nutrition['fat']}g, "
            f"탄수화물 {nutrition['carbohydrates']}g\n"
            "한글로 2~3문장, 영양 특징과 먹을 때 팁을 알려 주세요."
        )
        resp = self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "한국어 영양 코치입니다. 짧게 답하세요."},
                {"role": "user", "content": user},
            ],
            temperature=0.4,
        )
        return resp.choices[0].message.content.strip()