import requests
import json
import time
from core.config import (
    OLLAMA_URL,
    OLLAMA_MODEL,
    OLLAMA_FALLBACK_MODELS,
    OLLAMA_CONNECT_TIMEOUT,
    OLLAMA_READ_TIMEOUT,
    OLLAMA_MAX_RETRIES,
    OLLAMA_RETRY_BACKOFF_SECONDS
)


def _ollama_tags_url() -> str:
    if "/api/" in OLLAMA_URL:
        return OLLAMA_URL.split("/api/", 1)[0] + "/api/tags"
    return OLLAMA_URL.rstrip("/") + "/api/tags"


def _get_available_models():
    try:
        response = requests.get(_ollama_tags_url(), timeout=10)
        if response.status_code >= 400:
            return []
        payload = response.json()
        models = payload.get("models", [])
        return [m.get("name", "").strip() for m in models if m.get("name")]
    except (requests.RequestException, ValueError):
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

def generate_feedback(code: str):
    try:
        model_name = _resolve_model_name()
        prompt = f"""Return a JSON object with the following fields:
{{
  "explanation": "Clear, step-by-step explanation of what the code does",
  "time_complexity": "Estimated Big-O time complexity with one-line reasoning",
  "space_complexity": "Estimated Big-O space complexity with one-line reasoning",
  "strengths": ["List of 2-4 strengths in the submitted code"],
  "recommended_improvements": ["List of 3-6 concrete improvement suggestions"],
  "optimized_version": "A more optimized version of the code"
}}

Analyze this Python code:

{code}

Return ONLY valid JSON, no other text."""

        response = None
        last_error = None
        timeout = (OLLAMA_CONNECT_TIMEOUT, OLLAMA_READ_TIMEOUT)

        for attempt in range(OLLAMA_MAX_RETRIES + 1):
            try:
                response = requests.post(
                    OLLAMA_URL,
                    json={
                        "model": model_name,
                        "prompt": prompt,
                        "stream": False,
                        "keep_alive": "10m"
                    },
                    timeout=timeout
                )
                break
            except (requests.ReadTimeout, requests.ConnectTimeout, requests.ConnectionError) as err:
                last_error = err
                if attempt >= OLLAMA_MAX_RETRIES:
                    raise
                sleep_for = OLLAMA_RETRY_BACKOFF_SECONDS * (attempt + 1)
                time.sleep(sleep_for)

        if response is None:
            raise requests.RequestException(f"Ollama request did not return a response: {last_error}")
        
        if response.status_code >= 400:
            detail = ""
            try:
                detail = response.json().get("error", "")
            except ValueError:
                detail = response.text
            if response.status_code == 404 and "model" in detail.lower():
                available = _get_available_models()
                raise requests.RequestException(
                    f"Ollama model '{model_name}' not found. Available models: {', '.join(available) if available else 'none'}. "
                    f"Pull one with: ollama pull llama3.2"
                )
            raise requests.RequestException(
                f"Ollama request failed ({response.status_code}): {detail or 'Unknown error'}"
            )
        
        data = response.json()
        response_text = data.get("response", "")
        
        # Parse the JSON string from the response
        try:
            feedback = json.loads(response_text)
        except json.JSONDecodeError:
            start = response_text.find("{")
            end = response_text.rfind("}")
            if start == -1 or end == -1:
                raise
            feedback = json.loads(response_text[start:end + 1])
        improvements = feedback.get("recommended_improvements", [])
        if not isinstance(improvements, list):
            improvements = [str(improvements)]

        strengths = feedback.get("strengths", [])
        if not isinstance(strengths, list):
            strengths = [str(strengths)]
        
        return {
            "explanation": feedback.get("explanation", ""),
            "time_complexity": feedback.get("time_complexity", "Not available"),
            "space_complexity": feedback.get("space_complexity", "Not available"),
            "strengths": strengths,
            "recommended_improvements": improvements,
            "optimized_version": feedback.get("optimized_version", "")
        }
    except json.JSONDecodeError:
        return {
            "explanation": "Could not parse AI feedback",
            "time_complexity": "Not available",
            "space_complexity": "Not available",
            "strengths": [],
            "recommended_improvements": [],
            "optimized_version": ""
        }
    except requests.RequestException as e:
        message = str(e)
        if isinstance(e, requests.ReadTimeout):
            message = (
                f"{message}. Ollama exceeded read timeout ({OLLAMA_READ_TIMEOUT}s). "
                "Increase OLLAMA_READ_TIMEOUT or use a smaller model."
            )
        return {
            "explanation": f"Error connecting to AI service: {message}",
            "time_complexity": "Not available",
            "space_complexity": "Not available",
            "strengths": [],
            "recommended_improvements": [],
            "optimized_version": ""
        }
