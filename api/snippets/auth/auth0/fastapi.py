import json
import os
import urllib.request
from functools import lru_cache

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

ALGORITHMS = ["RS256"]

# auto_error=False so we can return 401 (not 403) when no credentials are supplied.
bearer_scheme = HTTPBearer(auto_error=False)


def _auth0_domain() -> str:
    return os.environ["AUTH0_DOMAIN"]


def _auth0_audience() -> str:
    return os.environ["AUTH0_AUDIENCE"]


@lru_cache(maxsize=1)
def _get_jwks() -> dict:
    """Fetches Auth0's public signing keys. Cached for the process lifetime."""
    url = f"https://{_auth0_domain()}/.well-known/jwks.json"
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
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    """FastAPI dependency that validates an Auth0 RS256 access token.

    Returns the decoded JWT claims (`sub` is the Auth0 user id).
    """
    if credentials is None:
        raise _unauthorized("No credentials provided.")
    token = credentials.credentials
    rsa_key = _signing_key(token)
    try:
        return jwt.decode(
            token,
            rsa_key,
            algorithms=ALGORITHMS,
            audience=_auth0_audience(),
            issuer=f"https://{_auth0_domain()}/",
        )
    except JWTError as err:
        raise _unauthorized(f"Invalid token: {err}") from err
