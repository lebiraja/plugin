"""
LLM provider registry.

A "provider" is an LLM endpoint the app can talk to. Two protocols are
supported:

* ``ollama``  — Ollama's native `/api/chat` + `/api/tags`.
* ``openai``  — the OpenAI `/v1/chat/completions` + `/v1/models` format, which
  LM Studio, OpenAI, OpenRouter, Groq, Together, DeepSeek, and most others
  speak. Only the base URL and (for cloud) a bearer key differ.

Built-in presets cover the common providers; users can also add a "custom"
OpenAI-compatible endpoint. User providers live in MongoDB (see
``provider_service``) and are merged over these presets by id.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional

OLLAMA = "ollama"
OPENAI = "openai"


@dataclass
class ProviderPreset:
    id: str
    name: str
    protocol: str  # OLLAMA | OPENAI
    base_url: str
    models_path: str
    requires_key: bool
    default_models: List[str] = field(default_factory=list)
    # Whether this preset is local infrastructure (probed for health) vs cloud.
    local: bool = False


# Base URLs are overridable from config for the local ones (handled by the
# resolver in llm_service); cloud URLs are fixed.
PRESETS: Dict[str, ProviderPreset] = {
    "ollama-default": ProviderPreset(
        id="ollama-default",
        name="Ollama",
        protocol=OLLAMA,
        base_url="",  # filled from settings.ollama_url at resolve time
        models_path="/api/tags",
        requires_key=False,
        local=True,
    ),
    "lmstudio-default": ProviderPreset(
        id="lmstudio-default",
        name="LM Studio",
        protocol=OPENAI,
        base_url="",  # filled from settings.lmstudio_url
        models_path="/v1/models",
        requires_key=False,
        local=True,
    ),
    "openai": ProviderPreset(
        id="openai",
        name="OpenAI",
        protocol=OPENAI,
        base_url="https://api.openai.com/v1",
        models_path="/models",
        requires_key=True,
        default_models=["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1-mini"],
    ),
    "openrouter": ProviderPreset(
        id="openrouter",
        name="OpenRouter",
        protocol=OPENAI,
        base_url="https://openrouter.ai/api/v1",
        models_path="/models",
        requires_key=True,
        default_models=[
            "openai/gpt-4o",
            "anthropic/claude-3.5-sonnet",
            "google/gemini-flash-1.5",
            "meta-llama/llama-3.1-70b-instruct",
        ],
    ),
    "groq": ProviderPreset(
        id="groq",
        name="Groq",
        protocol=OPENAI,
        base_url="https://api.groq.com/openai/v1",
        models_path="/models",
        requires_key=True,
        default_models=[
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "mixtral-8x7b-32768",
        ],
    ),
    "together": ProviderPreset(
        id="together",
        name="Together AI",
        protocol=OPENAI,
        base_url="https://api.together.xyz/v1",
        models_path="/models",
        requires_key=True,
        default_models=["meta-llama/Llama-3.3-70B-Instruct-Turbo"],
    ),
    "deepseek": ProviderPreset(
        id="deepseek",
        name="DeepSeek",
        protocol=OPENAI,
        base_url="https://api.deepseek.com",
        models_path="/models",
        requires_key=True,
        default_models=["deepseek-chat", "deepseek-reasoner"],
    ),
    "custom": ProviderPreset(
        id="custom",
        name="Custom (OpenAI-compatible)",
        protocol=OPENAI,
        base_url="",  # user supplies
        models_path="/models",
        requires_key=False,
    ),
}


def get_preset(provider_id: str) -> Optional[ProviderPreset]:
    return PRESETS.get(provider_id)


def list_presets() -> List[ProviderPreset]:
    return list(PRESETS.values())
