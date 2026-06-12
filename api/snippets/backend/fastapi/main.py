from dotenv import load_dotenv

# Load .env before importing modules that read environment variables at import time.
load_dotenv()

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.connection import init_db
from routes.example import router as example_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # v1 has no migration tool -- create tables on boot.
    # A missing database at startup only blocks DB-dependent routes, not /health.
    try:
        init_db()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Database unavailable at startup -- DB routes will fail: %s", exc)
    yield


app = FastAPI(title="{{PROJECT_NAME}}", lifespan=lifespan)

# CORS restricted to the frontend origin in development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("CLIENT_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(example_router, prefix="/api")
