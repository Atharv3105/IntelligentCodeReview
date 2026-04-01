import os
import pytest
from grading.engine import calculate_grade

# simple fixtures for input data
base_exec = {"error": ""}
base_ast = {"estimatedComplexity": "O(n)"}
base_quality = {"score": 80}


def test_perfect_solution():
    grade = calculate_grade(base_exec, base_ast, base_quality, plagiarism_score=0)
    assert grade == 100  # 100% correctness + quality/eff & no penalty


def test_with_error():
    exec_result = {"error": "RuntimeError"}
    grade = calculate_grade(exec_result, base_ast, base_quality, plagiarism_score=0)
    assert grade < 100
    assert grade >= 50 * float(os.getenv("GRADE_WEIGHT_CORRECTNESS", 0.5))


def test_plagiarism_penalty():
    g1 = calculate_grade(base_exec, base_ast, base_quality, plagiarism_score=0)
    g2 = calculate_grade(base_exec, base_ast, base_quality, plagiarism_score=1)
    assert g2 < g1


def test_weight_env_override(monkeypatch):
    monkeypatch.setenv("GRADE_WEIGHT_CORRECTNESS", "1")
    monkeypatch.setenv("GRADE_WEIGHT_EFFICIENCY", "0")
    monkeypatch.setenv("GRADE_WEIGHT_QUALITY", "0")
    grade = calculate_grade(base_exec, base_ast, base_quality, 0)
    # since only correctness matters, should be 100 or 50 depending on error
    assert grade == 100


def test_complexity_effect():
    ast_n2 = {"estimatedComplexity": "O(n^2)"}
    grade_n = calculate_grade(base_exec, base_ast, base_quality, 0)
    grade_n2 = calculate_grade(base_exec, ast_n2, base_quality, 0)
    assert grade_n2 < grade_n

if __name__ == "__main__":
    pytest.main([__file__])
