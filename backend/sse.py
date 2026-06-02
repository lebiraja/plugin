"""Server-Sent Events helpers.

A single place that formats dict events as SSE frames so chat, sessions, and
deep-research streaming all emit the same wire format the frontend parses.
"""

import json
from typing import Any, Dict


def sse_event(data: Dict[str, Any]) -> str:
    """Serialize a dict as one SSE ``data:`` frame (terminated by a blank line)."""
    return f"data: {json.dumps(data, default=str)}\n\n"
