import ast
import re
from core.logger import log

def analyze_ast(code: str):
    try:
        # 1. Attempt Python-specific AST parsing (most accurate for Python)
        tree = ast.parse(code)

        loop_count = 0
        recursion_detected = False

        class Visitor(ast.NodeVisitor):
            def visit_For(self, node):
                nonlocal loop_count
                loop_count += 1
                self.generic_visit(node)

            def visit_While(self, node):
                nonlocal loop_count
                loop_count += 1
                self.generic_visit(node)

            def visit_Call(self, node):
                nonlocal recursion_detected
                if isinstance(node.func, ast.Name):
                    recursion_detected = True
                self.generic_visit(node)

        Visitor().visit(tree)

        complexity = "O(n)"
        if loop_count >= 2:
            complexity = "O(n^2)"

        return {
            "loopCount": loop_count,
            "recursionDetected": recursion_detected,
            "estimatedComplexity": complexity
        }
    except Exception:
        # 2. Switch to Universal Heuristic Scanner for non-Python languages
        return analyze_text_heuristics(code)

def analyze_text_heuristics(code: str):
    """
    Regex-based loop and recursion detection for Java, C++, JS, etc.
    """
    log("Switching to text-based heuristics for complexity analysis.")
    
    # 1. Detect Loops (for, while, forEach)
    # Using word boundaries to avoid matching keywords inside variable names
    loop_patterns = [
        r'\bfor\s*\(',      # for (int i...)
        r'\bwhile\s*\(',    # while (true)
        r'\.forEach\s*\(',  # items.forEach(x => ...)
        r'\bfor\s+.*\s+in\b', # for x in y
        r'\bfor\s+.*\s+of\b'  # for x of y
    ]
    
    loop_count = 0
    for pattern in loop_patterns:
        loop_count += len(re.findall(pattern, code))

    # 2. Detect Recursion (Simple Heuristic: same word appearing as function and call)
    # This is a bit complex in regex, so we look for common recursive call patterns
    # Like 'search(args...)' inside the body of 'void search(...)'
    # We'll use a safer approach: check for repeated call signatures
    recursion_detected = False
    
    # Simple check for function calling itself (heuristic)
    # Look for common function declarations then their calls
    func_declarations = re.findall(r'(?:public|private|static|void|int|auto|function)\s+([a-zA-Z_]\w*)\s*\(', code)
    for func_name in func_declarations:
        if func_name in ['main', 'Solution', 'def']: continue # exclude noise
        # Look for the function name being CALLED elsewhere
        # If it appears more than once, it might be recursive
        if len(re.findall(rf'\b{func_name}\s*\(', code)) > 1:
            recursion_detected = True
            break

    # 3. Determine Complexity
    complexity = "O(n)"
    if loop_count == 0:
        complexity = "O(1)"
    elif loop_count >= 2:
        complexity = "O(n^2)"
    elif "binary" in code.lower() or "log" in code.lower():
        complexity = "O(log n)"

    return {
        "loopCount": loop_count,
        "recursionDetected": recursion_detected,
        "estimatedComplexity": complexity
    }