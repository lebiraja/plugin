"""Config must bind the various env var aliases that Docker Compose sets."""

import importlib


_ALL_ALIASES = [
    "OLLAMA_URL",
    "OLLAMA_HOST",
    "MONGODB_URL",
    "MONGO_URL",
    "MONGODB_URI",
    "CORS_ORIGINS",
]


def _reload_settings(monkeypatch, **env):
    # Clear every alias first so the test only exercises the ones it sets.
    for key in _ALL_ALIASES:
        monkeypatch.delenv(key, raising=False)
    for key, value in env.items():
        monkeypatch.setenv(key, value)
    import config

    importlib.reload(config)
    return config.Settings()


def test_ollama_host_alias_binds(monkeypatch):
    s = _reload_settings(monkeypatch, OLLAMA_HOST="http://ollama:11434")
    assert s.ollama_url == "http://ollama:11434"


def test_mongo_url_aliases_bind(monkeypatch):
    s = _reload_settings(monkeypatch, MONGO_URL="mongodb://u:p@mongodb:27017/")
    assert s.mongodb_url == "mongodb://u:p@mongodb:27017/"


def test_cors_origins_parsed_from_csv(monkeypatch):
    s = _reload_settings(monkeypatch, CORS_ORIGINS="http://a.com,http://b.com")
    assert s.cors_origins == ["http://a.com", "http://b.com"]
