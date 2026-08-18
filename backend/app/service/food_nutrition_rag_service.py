from pathlib import Path
import io
import json
import unicodedata

import torch
from fastapi import HTTPException, status
from openai import OpenAI
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

from app.config import settings
from app.schema.food_nutrition import NutritionInfo
from app.schema.food_nutrition_rag import NutritionRagAnalyzeResponse, RagCandidate

BACKEND_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = BACKEND_ROOT / "data"
SEEDS_PATH = BACKEND_ROOT / "seeds" / "nutrition_seeds.json"
CLIP_NAME = "openai/clip-vit-base-patch32"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
NUTRI_KEYS = ("calories", "protein", "fat", "carbohydrates")
TOP_K = 5


def nfc(text: str) -> str:
    return unicodedata.normalize("NFC", text)


class FoodNutritionRagService:
    def __init__(self) -> None:
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        if self.device.type == "cuda":
            print(f"CLIP RAG GPU: {torch.cuda.get_device_name(0)}")
        else:
            print("CLIP RAG CPU")

        raw = json.loads(SEEDS_PATH.read_text(encoding="utf-8"))
        self.seeds = {nfc(k): v for k, v in raw.items()}

        self.processor = CLIPProcessor.from_pretrained(CLIP_NAME)
        self.clip = CLIPModel.from_pretrained(CLIP_NAME).to(self.device)
        self.clip.eval()
        api_key = (settings.OPENAI_API_KEY or "").strip()
        self.openai = OpenAI(api_key=api_key) if api_key else None

        self.labels: list[str] = []
        embeddings: list[torch.Tensor] = []
        self._index_data(embeddings)
        if not embeddings:
            raise RuntimeError("backend/data 에서 RAG 이미지를 찾지 못했습니다.")
        self.gallery = torch.stack(embeddings, dim=0)

    def _index_data(self, embeddings: list[torch.Tensor]) -> None:
        folders = sorted(
            p for p in DATA_DIR.iterdir()
            if p.is_dir() and not p.name.startswith(".")
        )
        for folder in folders:
            food = nfc(folder.name)
            images = [
                p for p in folder.iterdir()
                if p.is_file() and p.suffix.lower() in IMAGE_EXTS
            ]
            for path in images:
                image = Image.open(path).convert("RGB")
                feat = self._embed(image)
                self.labels.append(food)
                embeddings.append(feat.cpu())

    def _embed(self, image: Image.Image) -> torch.Tensor:
        pixels = self.processor(images=image, return_tensors="pt")["pixel_values"]
        pixels = pixels.to(self.device)
        with torch.no_grad():
            outputs = self.clip.get_image_features(pixel_values=pixels)
            feat = outputs.pooler_output[0]
        feat = feat / feat.norm()
        return feat

    def _nutrition(self, food: str) -> NutritionInfo | None:
        item = self.seeds.get(food)
        if item is None:
            return None
        return NutritionInfo(**{k: float(item[k]) for k in NUTRI_KEYS})

    def analyze(self, image_bytes: bytes) -> NutritionRagAnalyzeResponse:
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미지 파일을 읽을 수 없습니다.",
            ) from exc

        query = self._embed(image).cpu()
        scores = self.gallery @ query
        topk = min(TOP_K, scores.numel())
        values, indices = torch.topk(scores, k=topk)

        seen: set[str] = set()
        candidates: list[RagCandidate] = []
        for score, idx in zip(values.tolist(), indices.tolist()):
            food = self.labels[idx]
            if food in seen:
                continue
            seen.add(food)
            candidates.append(
                RagCandidate(
                    food=food,
                    score=float(score),
                    seeds=self._nutrition(food),
                )
            )

        if not candidates:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="유사한 음식을 찾지 못했습니다.",
            )

        best = candidates[0]
        seeds = best.seeds
        if seeds is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"seeds 없음: {best.food}",
            )

        answer = self._openai_answer(best.food, seeds, candidates)
        return NutritionRagAnalyzeResponse(
            food=best.food,
            score=best.score,
            seeds=seeds,
            answer=answer,
            candidates=candidates,
        )

    def _openai_answer(
        self,
        food: str,
        seeds: NutritionInfo,
        candidates: list[RagCandidate],
    ) -> str:
        if self.openai is None:
            return self._fallback_answer(food, seeds, candidates)
        cand_txt = ", ".join(
            f"{c.food}({c.score:.2f})" for c in candidates
        )
        user = (
            f"RAG로 찾은 음식: {food}\n"
            f"유사도: {candidates[0].score:.2f}\n"
            f"칼로리 {seeds.calories}kcal, 단백질 {seeds.protein}g, "
            f"지방 {seeds.fat}g, 탄수화물 {seeds.carbohydrates}g\n"
            f"후보: {cand_txt}\n"
            "한글로 2~3문장, 이 음식의 영양과 RAG 검색 결과를 설명해 주세요."
        )
        try:
            resp = self.openai.chat.completions.create(
                model=settings.OPENAI_MODEL or "gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "한국어 영양 코치입니다. 짧게 답하세요."},
                    {"role": "user", "content": user},
                ],
                temperature=0.4,
                timeout=15.0,
            )
            return (resp.choices[0].message.content or "").strip() or self._fallback_answer(
                food, seeds, candidates
            )
        except Exception:
            return self._fallback_answer(food, seeds, candidates)

    def _fallback_answer(
        self,
        food: str,
        seeds: NutritionInfo,
        candidates: list[RagCandidate],
    ) -> str:
        cand_txt = ", ".join(f"{c.food}({c.score:.2f})" for c in candidates[:3])
        return (
            f"{food}이(가) 가장 유사한 음식으로 검색되었습니다. "
            f"칼로리 {seeds.calories}kcal, 단백질 {seeds.protein}g, 지방 {seeds.fat}g, "
            f"탄수화물 {seeds.carbohydrates}g입니다. "
            f"주요 후보는 {cand_txt}입니다."
        )