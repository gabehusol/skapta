import logging

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from limiter import limiter
from models.generate import GenerateRequest, GenerationOptions, StackSelection
from services.generate_service import generate_project

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate")
@limiter.limit("20/minute;200/day")
async def generate(request: Request, body: GenerateRequest):
    try:
        buf = generate_project(body)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Unexpected error in /api/generate")
        raise HTTPException(status_code=500, detail="Internal server error")

    filename = f"{body.project_name or 'my-app'}.zip"

    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
