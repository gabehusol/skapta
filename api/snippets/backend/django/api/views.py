from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from auth.provider import JWTAuthentication

from .models import UserProfile


def _serialize(profile: UserProfile) -> dict:
    return {
        "id": profile.id,
        "auth0Id": profile.auth0_id,
        "email": profile.email,
        "name": profile.name,
        "createdAt": profile.created_at.isoformat(),
    }


class UsersMeView(APIView):
    # Auth layer contract: the provider supplies JWTAuthentication; the view stays
    # auth-agnostic beyond requiring an authenticated principal.
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = UserProfile.objects.get(auth0_id=request.user.sub)
        except UserProfile.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(_serialize(profile))

    def post(self, request):
        profile, _ = UserProfile.objects.update_or_create(
            auth0_id=request.user.sub,
            defaults={
                "email": request.data.get("email"),
                "name": request.data.get("name"),
            },
        )
        return Response(_serialize(profile))
