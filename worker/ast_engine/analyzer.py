import ast

def analyze_ast(code: str):
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