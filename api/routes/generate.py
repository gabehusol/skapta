import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.generate import GenerateRequest, GenerationOptions, StackSelection
from services.generate_service import generate_project

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate")
async def generate(request: GenerateRequest):
    try:
        buf = generate_project(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Unexpected error in /api/generate")
        raise HTTPException(status_code=500, detail="Internal server error")

    filename = f"{request.project_name or 'my-app'}.zip"

    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
