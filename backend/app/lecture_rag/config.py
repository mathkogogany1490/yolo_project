from pathlib import Path

from app.config import settings

OPENAI_API_KEY = (settings.OPENAI_API_KEY or "").strip()
OPENAI_MODEL = (settings.OPENAI_MODEL or "gpt-4o-mini").strip() or "gpt-4o-mini"
DATA_DIR = Path(__file__).resolve().parents[2] / "lecture_data"
