import os
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlparse

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "change-me")
DEBUG = False


def _parse_csv_env(name: str, default: str) -> list[str]:
    raw = os.getenv(name, default)
    values: list[str] = []
    for item in raw.split(","):
        cleaned = item.strip().lstrip("=")
        if cleaned:
            values.append(cleaned)
    return values


def _parse_cors_allowed_origins() -> list[str]:
    origins: list[str] = []
    for origin in _parse_csv_env("CORS_ALLOWED_ORIGINS", "http://localhost:3000"):
        parsed = urlparse(origin)
        if parsed.scheme and parsed.netloc:
            origins.append(origin)
    # Keep a safe local default if all provided values are malformed
    return origins or ["http://localhost:3000","digikhaato.com","www.digikhaato.com","https://digikhaato.com","backend","api.digikhaato.com"]


ALLOWED_HOSTS = _parse_csv_env("DJANGO_ALLOWED_HOSTS", "*")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "apps.common",
    "apps.users",
    "apps.onboarding",
    "apps.jewellery",
    "apps.borrowers",
    "apps.loans",
    "apps.collections",
    "apps.accounts",
    "apps.dashboard",
    "apps.reports",
    "apps.notifications",
    "apps.customer_ledger",
    "apps.notes",
    "apps.locations",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB", os.getenv("PGDATABASE", "loan_mgmt")),
        "USER": os.getenv("POSTGRES_USER", os.getenv("PGUSER", "postgres")),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", os.getenv("PGPASSWORD", "postgres")),
        "HOST": os.getenv("POSTGRES_HOST", os.getenv("PGHOST", "localhost")),
        "PORT": os.getenv("POSTGRES_PORT", os.getenv("PGPORT", "5432")),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "users.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "apps.common.pagination.StandardResultsSetPagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=8),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
}

# Database cache — no Redis needed, uses the same Postgres DB
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.db.DatabaseCache",
        "LOCATION": "django_cache",
        "TIMEOUT": 60,
        "OPTIONS": {"MAX_ENTRIES": 1000},
    }
}

CORS_ALLOWED_ORIGINS = _parse_cors_allowed_origins()
# Required so the browser sends the httpOnly refresh_token cookie cross-origin
CORS_ALLOW_CREDENTIALS = True
