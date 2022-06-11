/**
 * A constructor for async functions.
 */
export const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor as AsyncGeneratorFunction;

/**
 * Used to represent a safe async evaluator.
 */
export interface ISafeAsyncFunction extends AsyncGeneratorFunction {
    result: any;
    finished: boolean;
}

/**
 * Generates a safe async function to be executed.
 * @param rightSideSafeExpression The safe right side expression.
 * @returns 
 */
export function SafeAsyncFunction(rightSideSafeExpression: string) {
    return new AsyncFunction(["__self", "scope"], /*js*/`
        with (scope) {
            __self.result = ${rightSideSafeExpression}
        };
        
        __self.finished = true;
        return __self.result;
    `) as any as ISafeAsyncFunction;
}