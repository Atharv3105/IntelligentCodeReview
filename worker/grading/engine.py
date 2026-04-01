import os

def calculate_grade(exec_result, ast_result, quality_result, plagiarism_score):
    # determine weights from environment variables (fall back to defaults)
    try:
        w_corr = float(os.getenv("GRADE_WEIGHT_CORRECTNESS", 0.5))
        w_eff = float(os.getenv("GRADE_WEIGHT_EFFICIENCY", 0.2))
        w_qual = float(os.getenv("GRADE_WEIGHT_QUALITY", 0.25))
    except ValueError:
        # invalid env value, revert to defaults
        w_corr, w_eff, w_qual = 0.5, 0.2, 0.25

    # normalize if they do not sum to 1
    total_w = w_corr + w_eff + w_qual
    if total_w <= 0:
        w_corr, w_eff, w_qual = 0.5, 0.2, 0.25
    else:
        w_corr /= total_w
        w_eff /= total_w
        w_qual /= total_w

    # Correctness: 100 if no errors, 50 if execution failed
    correctness = 100 if exec_result.get("error") == "" else 50

    # Efficiency based on complexity
    efficiency = 100
    complexity = ast_result.get("estimatedComplexity", "O(n)")
    if complexity == "O(n^2)":
        efficiency = 60
    elif complexity == "O(n log n)":
        efficiency = 85
    elif complexity == "O(1)":
        efficiency = 100

    # Quality score from actual analysis (0-100)
    quality_score = quality_result.get("score", 75) if isinstance(quality_result, dict) else 75
    quality_score = max(0, min(100, quality_score))  # Clamp to 0-100

    # Plagiarism penalty (0-25)
    plagiarism_penalty = min(plagiarism_score * 25, 25) if plagiarism_score else 0

    # Weighted calculation with configurable weights
    final = (
        correctness * w_corr +
        efficiency * w_eff +
        quality_score * w_qual -
        plagiarism_penalty
    )

    # Clamp final grade to 0-100
    return max(0, min(100, round(final, 2)))
