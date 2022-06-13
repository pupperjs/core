import { ISafeAsyncFunction, SafeAsyncFunction } from "../core/vdom/evaluator/SafeAsyncFunction";

/**
 * A handler containing all already-evaluated functions.
 */
const evaluatorMemo: Record<string, ISafeAsyncFunction> = {};

/**
 * Evaluates an expression string into a function.
 * @param expression The expression to be evaluated.
 * @returns 
 */
export function evaluateString<TExpressionResult = any>(expression: string) {
    // If this expression has already been evaluated
    if (evaluatorMemo[expression]) {
        return evaluatorMemo[expression];
    }

    // Some expressions that are useful in Alpine are not valid as the right side of an expression.
    // Here we'll detect if the expression isn't valid for an assignement and wrap it in a self-
    // calling function so that we don't throw an error AND a "return" statement can b e used.
    let rightSideSafeExpression = 0
        // Support expressions starting with "if" statements like: "if (...) doSomething()"
        || /^[\n\s]*if.*\(.*\)/.test(expression)
        // Support expressions starting with "let/const" like: "let foo = 'bar'"
        || /^(let|const)\s/.test(expression)
            ? `(() => { ${expression} })()`
            : expression

    let func: ISafeAsyncFunction<TExpressionResult>;

    try {
        func = SafeAsyncFunction(rightSideSafeExpression);
    } catch (err) {
        console.warn("pupper.js warning: invalid expression \"" + rightSideSafeExpression + "\"\n", err);
        return undefined;
    }

    evaluatorMemo[expression] = func;

    return func;
}

/**
 * Evaluates an expression.
 * @param expression The expression to be evaluated.
 * @returns 
 */
export function evaluateLater<TExpressionResult = any>(expression: string | number | boolean | CallableFunction) {
    if (typeof expression === "function") {
        return expression() as ISafeAsyncFunction<TExpressionResult>;
    }

    const func = evaluateString<TExpressionResult>(String(expression));

    if (func === undefined) {
        return undefined;
    }

    return func;
}

/**
 * Evaluates an expression if it's not a plain string.
 * @param expression The expression to be evaluated.
 * @returns 
 */
 export function maybeEvaluateLater<TExpressionResult = any>(expression: string | number | boolean | CallableFunction) {
    if (typeof expression === "function") {
        return expression() as ISafeAsyncFunction<TExpressionResult>;
    }

    const func = evaluateString<TExpressionResult>(String(expression));

    if (func === undefined) {
        return (): any => undefined;
    }

    if (typeof func === "string") {
        return () => func;
    }

    return func;
}

/**
 * Evaluates an expression and executes it immediately.
 * @param expression The expression to be evaluated.
 * @param scope The scope to be passed to the evaluator.
 * @returns 
 */
export async function evaluate<TExpressionResult = any>(expression: string | number | boolean | CallableFunction, scope: any) {
    const evaluated = evaluateLater(expression);

    if (evaluated === undefined) {
        return undefined;
    }

    try {
        return await evaluated(scope) as TExpressionResult;
    } catch(e) {
        console.warn("pupper.js warning: failed to evaluate " + expression, "\n", e);
    }
}

export function runIfIsFunction(value: CallableFunction | any) {
    if (typeof value === 'function') {
        return value();
    } else {
        return value;
    }
}