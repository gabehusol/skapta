import json
import os
import urllib.request
from functools import lru_cache

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

AUTH0_DOMAIN = os.environ["AUTH0_DOMAIN"]
AUTH0_AUDIENCE = os.environ["AUTH0_AUDIENCE"]
ALGORITHMS = ["RS256"]

bearer_scheme = HTTPBearer()


@lru_cache(maxsize=1)
def _get_jwks() -> dict:
    """Fetches Auth0's public signing keys. Cached for the process lifetime."""
    url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
    with urllib.request.urlopen(url, timeout=5) as resp:  # noqa: S310 (trusted Auth0 URL)
        return json.loads(resp.read())


def _signing_key(token: str) -> dict:
    try:
        header = jwt.get_unverified_header(token)
    except JWTError as err:
        raise _unauthorized(f"Invalid token header: {err}") from err

    for key in _get_jwks()["keys"]:
        if key["kid"] == header.get("kid"):
            return {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"],
            }
    raise _unauthorized("Unable to find a matching signing key.")


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """FastAPI dependency that validates an Auth0 RS256 access token.

    Returns the decoded JWT claims (`sub` is the Auth0 user id).
    """
    token = credentials.credentials
    rsa_key = _signing_key(token)
    try:
        return jwt.decode(
            token,
            rsa_key,
            algorithms=ALGORITHMS,
            audience=AUTH0_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/",
        )
    except JWTError as err:
        raise _unauthorized(f"Invalid token: {err}") from err
