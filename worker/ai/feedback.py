import json
from groq import Groq
from core.config import GROQ_API_KEY, GROQ_MODEL
from core.logger import log


def generate_feedback(code: str, language: str = "python"):
    try:
        if not GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not set in environment variables.")

        client = Groq(api_key=GROQ_API_KEY)

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

        chat_completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1
        )

        response_text = chat_completion.choices[0].message.content

        # Parse the JSON response
        try:
            feedback = json.loads(response_text)
        except json.JSONDecodeError as e:
            log(f"JSON Parse Error: {str(e)}. Attempting recovery...")
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
        return {
            "explanation": "AI feedback unavailable. The code execution was successful and your stats are saved.",
            "time_complexity": "O(n?)",
            "space_complexity": "O(n?)",
            "strengths": ["Logic was processed successfully"],
            "recommended_improvements": [f"AI service error: {str(e)}"],
            "optimized_version": ""
        }
