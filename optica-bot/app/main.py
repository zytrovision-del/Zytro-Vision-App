from app.core.config import FastAPI, FASTAPI_AVAILABLE
from app.core.database import DB_MODE
from app.api.v1.api import api_router

app = FastAPI(title="Zytro Vision MVP Bot")
app.include_router(api_router)

if __name__ == "__main__":
    print(f"Zytro Vision MVP ejecutado correctamente | DB mode: {DB_MODE}")
    if FASTAPI_AVAILABLE:
        print("Puedes levantar API con: uvicorn app.main:app --reload")
