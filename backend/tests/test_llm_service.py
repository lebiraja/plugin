"""Unit tests for LLMService message construction (no network)."""

from services.llm_service import LLMService


def test_build_messages_orders_system_history_user():
    messages = LLMService._build_messages(
        "hello",
        [{"role": "user", "content": "a"}, {"role": "assistant", "content": "b"}],
        "be helpful",
    )
    assert messages[0] == {"role": "system", "content": "be helpful"}
    assert messages[-1] == {"role": "user", "content": "hello"}
    assert len(messages) == 4


def test_build_messages_without_system_or_history():
    messages = LLMService._build_messages("hi", None, None)
    assert messages == [{"role": "user", "content": "hi"}]


def test_options_maps_camel_and_snake_case():
    opts = LLMService._options({"temperature": 0.5, "topP": 0.8, "maxTokens": 100})
    assert opts == {"temperature": 0.5, "top_p": 0.8, "num_predict": 100}


def test_done_event_sums_tokens():
    assert LLMService._done_event(3, 7) == {
        "type": "done",
        "tokens": {"prompt": 3, "completion": 7, "total": 10},
    }
