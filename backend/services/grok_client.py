import json
import os
from typing import Any, Dict, Optional

from openai import OpenAI
from pydantic import BaseModel, ValidationError

XAI_BASE_URL = "https://api.x.ai/v1"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
# Model names are hardcoded (do not come from env):
MODEL_XAI = "grok-4-fast"
MODEL_GROQ = "openai/gpt-oss-120b"
MODEL_GROQ_STT = "whisper-large-v3"

ALLOWED_PREFERENCES = {
    "lowest_fare",
    "fastest",
    "least_walking",
    "most_comfortable",
    "balanced",
    "none",
}
ALLOWED_LANGUAGES = {"roman_urdu", "urdu", "english", "mixed"}


class GrokError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


class TransitIntent(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    fare_limit: Optional[float] = None
    arrival_deadline: Optional[str] = None
    departure_time: Optional[str] = None
    preference: str = "none"
    language: str = "english"


INTENT_JSON_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "origin": {"type": ["string", "null"]},
        "destination": {"type": ["string", "null"]},
        "fare_limit": {"type": ["number", "null"]},
        "arrival_deadline": {"type": ["string", "null"]},
        "departure_time": {"type": ["string", "null"]},
        "preference": {
            "type": "string",
            "enum": [
                "lowest_fare",
                "fastest",
                "least_walking",
                "most_comfortable",
                "balanced",
                "none",
            ],
        },
        "language": {
            "type": "string",
            "enum": ["roman_urdu", "urdu", "english", "mixed"],
        },
    },
    "required": [
        "origin",
        "destination",
        "fare_limit",
        "arrival_deadline",
        "departure_time",
        "preference",
        "language",
    ],
    "additionalProperties": False,
}


def get_api_key() -> Optional[str]:
    return os.getenv("XAI_API_KEY") or os.getenv("GROQ_API_KEY")


def _is_groq_key(key: str) -> bool:
    return key.startswith(("gsk_", "gsk-"))


def provider_name() -> str:
    """Human-readable name of the active LLM provider (for the AI status payload)."""
    key = get_api_key()
    if not key or not key.strip():
        return "none"
    return "groq" if _is_groq_key(key.strip()) else "xai-grok"


def grok_configured() -> bool:
    key = get_api_key()
    return bool(key and key.strip())


def _client() -> OpenAI:
    key = get_api_key()
    if not key or not key.strip():
        raise GrokError("missing_api_key", "XAI_API_KEY is not configured")
    key = key.strip()
    base_url = GROQ_BASE_URL if _is_groq_key(key) else XAI_BASE_URL
    return OpenAI(api_key=key, base_url=base_url, timeout=30.0)


def _model_name() -> str:
    # Hardcoded model selection per provider.
    if provider_name() == "groq":
        return MODEL_GROQ
    return MODEL_XAI


def intent_to_dict(intent: TransitIntent) -> Dict[str, Any]:
    data = intent.model_dump()
    pref = (data.get("preference") or "none").strip().lower()
    lang = (data.get("language") or "english").strip().lower()
    data["preference"] = pref if pref in ALLOWED_PREFERENCES else "none"
    data["language"] = lang if lang in ALLOWED_LANGUAGES else "english"
    for key in ("origin", "destination", "arrival_deadline", "departure_time"):
        val = data.get(key)
        if isinstance(val, str):
            val = val.strip()
            data[key] = val if val else None
    return data


def extract_transit_intent(
    user_message: str,
    current_location: Optional[str] = None,
    current_time: Optional[str] = None,
) -> Dict[str, Any]:
    """Send user text to Grok and return a validated transit intent dict."""
    context = {
        "current_location": current_location,
        "current_time": current_time,
    }
    system = (
        "You extract Karachi public-transport intent from messy English, Urdu, "
        "Roman Urdu, or mixed text. Return only the structured schema.\n"
        "Rules:\n"
        "- Extract only facts that appear in the user message.\n"
        "- Do not invent origin, destination, fare, or times.\n"
        "- Do not guess GPS or the current clock; context may already include them.\n"
        "- Do not copy current_location into origin unless the user clearly means "
        "'from here' / 'yahan se' without naming another origin.\n"
        "- Map local phrases: 'sasti bus' -> lowest_fare, 'jaldi pohanchna' -> fastest, "
        "'kam walking' / 'kam chalna' -> least_walking, 'aaram se' / 'AC' -> most_comfortable.\n"
        "- arrival_deadline and departure_time must be HH:MM 24-hour if present, else null.\n"
        "- fare_limit is a number in PKR if the user states a budget, else null.\n"
        "- language is the user's writing style: roman_urdu, urdu, english, or mixed."
    )
    user_payload = (
        f"Backend context (do not invent extra values from this): {json.dumps(context)}\n\n"
        f"User message:\n{user_message}"
    )

    client = _client()

    # Groq: OpenAI-compatible chat completions with strict JSON mode.
    if provider_name() == "groq":
        try:
            response = client.chat.completions.create(
                model=_model_name(),
                temperature=0,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": system
                        + "\nRespond ONLY with a JSON object using exactly this schema:\n"
                        + json.dumps(INTENT_JSON_SCHEMA),
                    },
                    {"role": "user", "content": user_payload + "\n\nJSON only."},
                ],
            )
            raw = (response.choices[0].message.content or "").strip()
            data = json.loads(raw)
            return intent_to_dict(TransitIntent.model_validate(data))
        except GrokError:
            raise
        except ValidationError as err:
            raise GrokError(
                "malformed_ai_output", "Grok intent failed schema validation"
            ) from err
        except Exception as err:
            lowered = str(err).lower()
            if "timeout" in lowered or "timed out" in lowered:
                raise GrokError("timeout", "Grok intent extraction timed out") from err
            raise GrokError("grok_api_failure", "Grok intent extraction failed") from err

    # xAI: structured Responses API with a JSON-schema fallback.
    try:
        response = client.responses.parse(
            model=_model_name(),
            store=False,
            input=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_payload},
            ],
            text_format=TransitIntent,
        )
        parsed = response.output_parsed
        if parsed is None:
            raise GrokError("malformed_ai_output", "Grok returned no structured intent")
        return intent_to_dict(parsed)
    except GrokError:
        raise
    except ValidationError as err:
        raise GrokError("malformed_ai_output", "Grok intent failed schema validation") from err
    except Exception as err:
        # Fallback: structured JSON schema via responses.create
        try:
            response = client.responses.create(
                model=_model_name(),
                store=False,
                input=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_payload},
                ],
                text={
                    "format": {
                        "type": "json_schema",
                        "name": "transit_intent",
                        "strict": True,
                        "schema": INTENT_JSON_SCHEMA,
                    }
                },
            )
            raw = getattr(response, "output_text", None) or ""
            data = json.loads(raw)
            return intent_to_dict(TransitIntent.model_validate(data))
        except GrokError:
            raise
        except Exception as inner:
            message = str(inner) or str(err)
            lowered = message.lower()
            code = "grok_api_failure"
            if "timeout" in lowered or "timed out" in lowered:
                code = "timeout"
            raise GrokError(code, "Grok intent extraction failed") from inner


def generate_user_response(
    user_message: str,
    intent: Dict[str, Any],
    backend_result: Dict[str, Any],
) -> str:
    """Turn deterministic backend JSON into a natural reply in the user's style."""
    language = intent.get("language") or "english"
    system = (
        "You are the spoken layer of a Karachi transit app.\n"
        "Write a concise reply using ONLY the backend JSON facts.\n"
        f"Respond in the user's original language/style: {language}.\n"
        "If language is roman_urdu, write Roman Urdu (Latin script).\n"
        "If language is urdu, write Urdu script.\n"
        "If language is english, write English.\n"
        "If language is mixed, you may mix briefly, matching the user.\n"
        "Do not invent routes, fares, wait times, or disruptions.\n"
        "Do not change numerical values.\n"
        "If backend says available=false, do not claim a bus/route is available.\n"
        "Keep it to 1-3 short sentences."
    )
    user_payload = (
        f"User message:\n{user_message}\n\n"
        f"Extracted intent:\n{json.dumps(intent, ensure_ascii=False)}\n\n"
        f"Backend result JSON:\n{json.dumps(backend_result, ensure_ascii=False)}"
    )
    client = _client()

    # Groq: OpenAI-compatible chat completions.
    if provider_name() == "groq":
        try:
            response = client.chat.completions.create(
                model=_model_name(),
                temperature=0.3,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_payload},
                ],
            )
            text = ((response.choices[0].message.content or "").strip())
            if not text:
                raise GrokError("malformed_ai_output", "Grok returned an empty response")
            return text
        except GrokError:
            raise
        except Exception as err:
            lowered = str(err).lower()
            code = "timeout" if "timeout" in lowered or "timed out" in lowered else "grok_api_failure"
            raise GrokError(code, "Grok response generation failed") from err

    # xAI: Responses API.
    try:
        response = client.responses.create(
            model=_model_name(),
            store=False,
            input=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_payload},
            ],
        )
        text = (getattr(response, "output_text", None) or "").strip()
        if not text:
            raise GrokError("malformed_ai_output", "Grok returned an empty response")
        return text
    except GrokError:
        raise
    except Exception as err:
        lowered = str(err).lower()
        code = "timeout" if "timeout" in lowered or "timed out" in lowered else "grok_api_failure"
        raise GrokError(code, "Grok response generation failed") from err


def transcribe_audio(file_bytes: bytes, filename: str = "audio.webm") -> str:
    """Transcribe audio. Uses Groq Whisper for gsk_ keys, xAI STT for xai- keys."""
    key = get_api_key()
    if not key or not key.strip():
        raise GrokError("missing_api_key", "XAI_API_KEY is not configured")
    key = key.strip()

    if _is_groq_key(key):
        try:
            client = OpenAI(
                api_key=key, base_url=GROQ_BASE_URL, timeout=45.0
            )
            model = MODEL_GROQ_STT
            transcript_obj = client.audio.transcriptions.create(
                model=model,
                file=(filename, file_bytes),
            )
            text = (getattr(transcript_obj, "text", "") or "").strip()
            if not text:
                raise GrokError(
                    "malformed_ai_output", "No speech could be transcribed"
                )
            return text
        except GrokError:
            raise
        except Exception as err:
            lowered = str(err).lower()
            code = "timeout" if "timeout" in lowered or "timed out" in lowered else "grok_api_failure"
            raise GrokError(code, "Speech-to-text failed") from err

    import httpx

    files = {"file": (filename, file_bytes)}
    try:
        with httpx.Client(timeout=45.0) as http:
            res = http.post(
                f"{XAI_BASE_URL}/stt",
                headers={"Authorization": f"Bearer {key.strip()}"},
                files=files,
                data={"format": "true"},
            )
        if res.status_code >= 400:
            raise GrokError("grok_api_failure", "Speech-to-text request failed")
        payload = res.json()
        text = (payload.get("text") or "").strip()
        if not text:
            raise GrokError("malformed_ai_output", "No speech could be transcribed")
        return text
    except GrokError:
        raise
    except Exception as err:
        lowered = str(err).lower()
        code = "timeout" if "timeout" in lowered or "timed out" in lowered else "grok_api_failure"
        raise GrokError(code, "Speech-to-text failed") from err
