/**
 * Executes a callback in the next tick.
 * @param callback The callback to be executed.
 * @returns 
 */
export function $nextTick(callback: CallableFunction) {
    return this.$component.renderer.nextTick(callback);
}