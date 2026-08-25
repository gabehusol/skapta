from fastapi import APIRouter

from config import settings

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    #Report whether the RAG dependencies are actually configured rather than a
    #hardcoded string. Checks key presence (cheap) — not full connectivity.
    return {
        "status": "ok",
        "groq": "configured" if settings.groq_api_key else "missing key",
        "pinecone": "configured" if settings.pinecone_api_key else "missing key",
    }
