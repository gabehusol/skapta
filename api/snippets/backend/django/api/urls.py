from django.urls import path

from .views import UsersMeView

urlpatterns = [
    path("users/me", UsersMeView.as_view()),
]
