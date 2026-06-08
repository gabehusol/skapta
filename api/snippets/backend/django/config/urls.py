from django.http import JsonResponse
from django.urls import include, path


def health(_request) -> JsonResponse:
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("health", health),
    path("api/", include("api.urls")),
]
