from django.db import models


class UserProfile(models.Model):
    # Stores the external auth provider's user id (e.g. the Auth0 `sub`).
    auth0_id = models.CharField(max_length=255, unique=True)
    email = models.EmailField(null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.auth0_id
