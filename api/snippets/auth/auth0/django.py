import json
import os
import urllib.request
from functools import lru_cache

from jose import JWTError, jwt
from rest_framework import authentication, exceptions

# Backend half of the auth layer contract for Auth0 (Django REST Framework).
# Exposes `JWTAuthentication`, a DRF authentication class. Views attach it via
# `authentication_classes = [JWTAuthentication]`; on success `request.user.sub`
# is the Auth0 user id and `request.auth` holds the decoded claims.

ALGORITHMS = ["RS256"]


def _auth0_domain() -> str:
    """Read at call-time so the module can be imported without env vars set."""
    return os.environ["AUTH0_DOMAIN"]


def _auth0_audience() -> str:
    return os.environ["AUTH0_AUDIENCE"]


@lru_cache(maxsize=1)
def _get_jwks(domain: str) -> dict:
    """Fetches Auth0's public signing keys. Cached per domain for the process lifetime."""
    url = f"https://{domain}/.well-known/jwks.json"
    with urllib.request.urlopen(url, timeout=5) as resp:  # noqa: S310 (trusted Auth0 URL)
        return json.loads(resp.read())


def _signing_key(token: str) -> dict:
    try:
        header = jwt.get_unverified_header(token)
    except JWTError as err:
        raise exceptions.AuthenticationFailed(f"Invalid token header: {err}") from err

    for key in _get_jwks(_auth0_domain())["keys"]:
        if key["kid"] == header.get("kid"):
            return {k: key[k] for k in ("kty", "kid", "use", "n", "e")}
    raise exceptions.AuthenticationFailed("Unable to find a matching signing key.")


class _Auth0User:
    """Minimal authenticated principal -- DRF needs `is_authenticated` and an id."""

    is_authenticated = True

    def __init__(self, sub: str):
        self.sub = sub


class JWTAuthentication(authentication.BaseAuthentication):
    """Validates an Auth0 RS256 access token from the Authorization header."""

    def authenticate_header(self, request) -> str:
        """Return WWW-Authenticate header value; tells DRF to respond 401 not 403."""
        return 'Bearer realm="api"'

    def authenticate(self, request):
        header = request.META.get("HTTP_AUTHORIZATION", "")
        if not header.startswith("Bearer "):
            return None  # no credentials -> DRF treats the request as anonymous

        token = header.split(" ", 1)[1]
        domain = _auth0_domain()
        audience = _auth0_audience()
        rsa_key = _signing_key(token)
        try:
            claims = jwt.decode(
                token,
                rsa_key,
                algorithms=ALGORITHMS,
                audience=audience,
                issuer=f"https://{domain}/",
            )
        except JWTError as err:
            raise exceptions.AuthenticationFailed(f"Invalid token: {err}") from err

        return (_Auth0User(claims["sub"]), claims)
