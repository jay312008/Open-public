/**
 * Safe recursive-descent math expression evaluator (NO eval / Function).
 * Supports: +, -, *, /, ^, parentheses, variables (e.g. x, m, a, f, r),
 * constants (pi, e), and functions (sin, cos, tan, sqrt, abs, log, ln, exp).
 */
export function evaluateMathExpression(
  rawExpr: string,
  vars: Record<string, number> = {}
): number {
  const expr = rawExpr
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\s+/g, '')
    // Insert implicit multiplication: 2x -> 2*x, 2( -> 2*(, )( -> )*(, x( -> x*(
    .replace(/(\d)([a-zA-Z(])/g, '$1*$2')
    .replace(/(\))(\d|[a-zA-Z(])/g, '$1*$2');

  let pos = 0;

  function peek(): string {
    return expr[pos] ?? '';
  }

  function consume(): string {
    return expr[pos++] ?? '';
  }

  function parseExpression(): number {
    let val = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const right = parseTerm();
      val = op === '+' ? val + right : val - right;
    }
    return val;
  }

  function parseTerm(): number {
    let val = parsePower();
    while (peek() === '*' || peek() === '/') {
      const op = consume();
      const right = parsePower();
      val = op === '*' ? val * right : right === 0 ? NaN : val / right;
    }
    return val;
  }

  function parsePower(): number {
    const base = parseUnary();
    if (peek() === '^') {
      consume();
      const exp = parsePower();
      return Math.pow(base, exp);
    }
    return base;
  }

  function parseUnary(): number {
    if (peek() === '-') {
      consume();
      return -parseUnary();
    }
    if (peek() === '+') {
      consume();
      return parseUnary();
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    if (peek() === '(') {
      consume();
      const val = parseExpression();
      if (peek() === ')') consume();
      return val;
    }

    // Number literal
    if (/[0-9.]/.test(peek())) {
      let numStr = '';
      while (/[0-9.]/.test(peek())) numStr += consume();
      return parseFloat(numStr);
    }

    // Identifier (function or variable/constant)
    if (/[a-zA-Z_]/.test(peek())) {
      let ident = '';
      while (/[a-zA-Z0-9_]/.test(peek())) ident += consume();
      const lower = ident.toLowerCase();

      if (peek() === '(') {
        consume();
        const arg = parseExpression();
        if (peek() === ')') consume();
        switch (lower) {
          case 'sin':
            return Math.sin(arg);
          case 'cos':
            return Math.cos(arg);
          case 'tan':
            return Math.tan(arg);
          case 'sqrt':
            return Math.sqrt(arg);
          case 'abs':
            return Math.abs(arg);
          case 'log':
            return Math.log10(arg);
          case 'ln':
            return Math.log(arg);
          case 'exp':
            return Math.exp(arg);
          default:
            return NaN;
        }
      }

      if (lower === 'pi') return Math.PI;
      if (lower === 'e' && vars.e === undefined) return Math.E;
      if (vars[ident] !== undefined) return vars[ident];
      if (vars[lower] !== undefined) return vars[lower];
      return NaN;
    }

    return NaN;
  }

  try {
    const result = parseExpression();
    return Number.isFinite(result) ? result : NaN;
  } catch {
    return NaN;
  }
}
