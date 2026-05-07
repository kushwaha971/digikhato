from pathlib import Path

from .base import *

BASE_DIR = Path(__file__).resolve().parent.parent.parent

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": str(BASE_DIR / "test.sqlite3"),
    }
}

# Keep test runtime independent from DB cache table setup.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "jwl-tests",
    }
}

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
