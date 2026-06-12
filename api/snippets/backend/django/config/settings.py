import os
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

# Load .env before reading any environment variables.
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-insecure-change-me")
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "*").split(",")

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "corsheaders",
    "rest_framework",
    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# Parses DATABASE_URL (e.g. postgresql://user:pass@host:5432/db).
DATABASES = {
    "default": dj_database_url.config(
        default=os.environ.get("DATABASE_URL", ""),
        conn_max_age=600,
    )
}

# Auth is enforced per-view via the JWTAuthentication class (auth layer contract);
# the global defaults stay open so unprotected routes (e.g. health) work.
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
}

# CORS pinned to the frontend origin (security default).
CORS_ALLOWED_ORIGINS = [os.environ.get("CLIENT_URL", "http://localhost:5173")]

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
