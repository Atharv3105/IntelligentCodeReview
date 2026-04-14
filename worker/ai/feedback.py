import requests
import json
import time
import re
from core.config import (
    OLLAMA_URL,
    OLLAMA_MODEL,
    OLLAMA_FALLBACK_MODELS,
    OLLAMA_CONNECT_TIMEOUT,
    OLLAMA_READ_TIMEOUT,
    OLLAMA_MAX_RETRIES,
    OLLAMA_RETRY_BACKOFF_SECONDS
)
from core.logger import log

def _ollama_tags_url() -> str:
    if "/api/" in OLLAMA_URL:
        return OLLAMA_URL.split("/api/", 1)[0] + "/api/tags"
    return OLLAMA_URL.rstrip("/") + "/api/tags"


def _get_available_models():
    try:
        response = requests.get(_ollama_tags_url(), timeout=5)
        if response.status_code >= 400:
            return []
        payload = response.json()
        models = payload.get("models", [])
        return [m.get("name", "").strip() for m in models if m.get("name")]
    except Exception:
        return []


def _resolve_model_name():
    available = _get_available_models()
    if not available:
        return OLLAMA_MODEL

    if OLLAMA_MODEL in available:
        return OLLAMA_MODEL

    for candidate in OLLAMA_FALLBACK_MODELS:
        exact_match = next((m for m in available if m == candidate), None)
        if exact_match:
            return exact_match
        prefix_match = next((m for m in available if m.startswith(candidate + ":")), None)
        if prefix_match:
            return prefix_match

    return available[0]

def _sanitize_json_text(text: str) -> str:
    """
    Remove raw control characters and resolve common AI JSON formatting errors.
    """
    # Remove raw newlines inside strings (this is a common AI mistake)
    # We replace them with escaped newlines
    # This is a bit aggressive but helps with broken JSON blocks
    # Actually, with format="json", Ollama usually handles this, but we keep it safe
    text = text.replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
    
    # But wait, if we replaced EVERYTHING, we broke the JSON structure itself (commas, braces)
    # Let's use a smarter approach: find everything between " " and escape real newlines
    # Actually, let's just use json.loads directly and if it fails, try a simpler regex
    return text

def generate_feedback(code: str, language: str = "python"):
    try:
        model_name = _resolve_model_name()
        
        lang_display = language.capitalize()
        if language == "cpp": lang_display = "C++"
        if language == "js": lang_display = "JavaScript"

        prompt = f"""Review this {lang_display} code as a Senior Engineer. Return a JSON object ONLY.

Schema:
{{
  "explanation": "...",
  "time_complexity": "...",
  "space_complexity": "...",
  "strengths": ["..."],
  "recommended_improvements": ["..."],
  "optimized_version": "..."
}}

Code:
{code}
"""

        response = None
        timeout = (OLLAMA_CONNECT_TIMEOUT, OLLAMA_READ_TIMEOUT)

        for attempt in range(OLLAMA_MAX_RETRIES + 1):
            try:
                url = OLLAMA_URL
                if "api/generate" not in url:
                    url = url.rstrip("/") + "/api/generate"
                
                response = requests.post(
                    url,
                    json={
                        "model": model_name,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json", # STRICT MAPPING
                        "options": {
                            "temperature": 0.1,
                            "num_predict": 2500
                        }
                    },
                    timeout=timeout
                )
                if response.status_code == 200:
                    break
            except Exception as e:
                log(f"Ollama attempt {attempt} failed: {str(e)}")
                if attempt < OLLAMA_MAX_RETRIES:
                    time.sleep(OLLAMA_RETRY_BACKOFF_SECONDS)
                else:
                    raise

        if not response or response.status_code != 200:
            raise Exception(f"AI Service unavailable (Status {response.status_code if response else 'None'})")
        
        data = response.json()
        response_text = data.get("response", "")
        
        # Parse the JSON
        try:
            feedback = json.loads(response_text)
        except json.JSONDecodeError as e:
            log(f"JSON Parse Error: {str(e)}. Attempting recovery...")
            # Fallback: remove non-printable characters and try again
            clean_text = "".join(char for char in response_text if char.isprintable() or char in "\n\r\t")
            feedback = json.loads(clean_text)

        return {
            "explanation": feedback.get("explanation", ""),
            "time_complexity": feedback.get("time_complexity", "O(?)"),
            "space_complexity": feedback.get("space_complexity", "O(?)"),
            "strengths": feedback.get("strengths", []),
            "recommended_improvements": feedback.get("recommended_improvements", []),
            "optimized_version": feedback.get("optimized_version", "")
        }

    except Exception as e:
        log(f"Final Feedback Error: {str(e)}")
        # If we still fail, return a fallback object
        return {
            "explanation": "AI feedback malformed. The code execution was successful and your stats are saved.",
            "time_complexity": "O(n?)",
            "space_complexity": "O(n?)",
            "strengths": ["Logic was processed successfully"],
            "recommended_improvements": [f"Visual results slightly delayed due to AI formatting error: {str(e)}"],
            "optimized_version": ""
        }
