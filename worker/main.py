from fastapi import FastAPI
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

    code = payload.get("code")

    log("Starting analysis pipeline")

    ast_result = analyze_ast(code)
    quality_result = analyze_quality(code)
    execution_result = execute_code(code)
    plagiarism_score = check_plagiarism(code)
    feedback = generate_feedback(code)

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