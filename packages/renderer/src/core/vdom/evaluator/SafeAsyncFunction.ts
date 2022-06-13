/**
 * A constructor for async functions.
 */
export const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

export interface ISafeAsyncProps {
    result: any;
    finished: boolean;
}

export type TAsyncFunction<TResultType = any> = ((scope: Record<string, any>) => Promise<TResultType>);

/**
 * Used to represent a safe async evaluator.
 */
export type ISafeAsyncFunction<TResultType = any> = ISafeAsyncProps & TAsyncFunction<TResultType>;

/**
 * Generates a safe async function to be executed.
 * @param rightSideSafeExpression The safe right side expression.
 * @returns 
 */
export function SafeAsyncFunction<TResultType = any>(rightSideSafeExpression: string): ISafeAsyncFunction<TResultType> {
    return new AsyncFunction(["scope"], /*js*/`
        with (scope) {
            return ${rightSideSafeExpression}
        };
    `);
}