from slowapi import Limiter
from slowapi.util import get_remote_address

# Key function: rate-limit by client IP.
# Behind a reverse proxy (Railway, Vercel) the real IP is in X-Forwarded-For --
# slowapi's get_remote_address reads that header automatically.
limiter = Limiter(key_func=get_remote_address)
