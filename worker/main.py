from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import traceback
from core.logger import log
from ast_engine.analyzer import analyze_ast
from static_analysis.quality import analyze_quality
from executor.sandbox import execute_code
from plagiarism.detector import check_plagiarism
from ai.feedback import generate_feedback
from grading.engine import calculate_grade

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "Worker running"}

@app.post("/analyze")
def analyze(payload: dict):
    try:
        code = payload.get("code")
        language = payload.get("language", "python")

        log(f"Starting analysis pipeline for language: {language}")

        # 1. AST Analysis
        log("Running AST Analysis...")
        ast_result = analyze_ast(code)

        # 2. Quality Analysis
        log("Running Quality Analysis...")
        quality_result = analyze_quality(code, language)

        # 3. Execution (The most common crash point)
        log("Running Code Execution...")
        execution_result = execute_code(code, language)
        if execution_result.get("error") and "ImageNotFound" in execution_result.get("error"):
            log(f"CRITICAL: Docker image for {language} not found!")

        # 4. Plagiarism Check
        log("Running Plagiarism Check...")
        try:
            plagiarism_score = check_plagiarism(code)
        except Exception as e:
            log(f"Plagiarism check failed: {str(e)}")
            plagiarism_score = 0.0

        # 5. AI Feedback
        log("Generating AI Feedback...")
        feedback = generate_feedback(code, language)

        # 6. Final Grading
        log("Calculating Grade...")
        grade = calculate_grade(
            execution_result,
            ast_result,
            quality_result,
            plagiarism_score
        )

        return {
            "execution": execution_result,
            "complexity": ast_result,
            "quality": quality_result,
            "plagiarism": plagiarism_score,
            "feedback": feedback,
            "grade": grade
        }

    except Exception as e:
        error_trace = traceback.format_exc()
        log(f"Worker Pipeline Crashed: {error_trace}")
        # Return a 400 with the error so it shows up in the DB/Dashboard
        return JSONResponse(
            status_code=400,
            content={
                "error": str(e),
                "detail": "Pipeline crash. Check worker logs for traceback.",
                "traceback": error_trace
            }
        )