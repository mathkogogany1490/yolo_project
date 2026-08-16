docker compose up -d
docker compose down
docker ps
docker logs backend-postgres

uv pip install -r requirements.txt


uvicorn app.main:app --reload --reload-dir app --host 127.0.0.1 --port 8000