const debuggerModule = require("debug");

type FLogger = (message: string, ...args: any[]) => void;

export let enabled = localStorage.getItem("pupperjs:debug") === "1";

/**
 * The base pupper logger instance.
 */
export const logger = debuggerModule("pupper") as (FLogger & {
    extend: (namespace: string) => FLogger
});

/**
 * Returns an extended debugger instance.
 * @param namespace The namespace to extend to.
 * @returns 
 */
export function extend(namespace: string) {
    return logger.extend(namespace);
}

/**
 * Prints a debug message to the console.
 * @param message The message to be displayed, in sprintf format.
 * @param args Any arguments to be passed to the message sprintf.
 * @returns 
 */
export function debug(message: string, ...args: any[]) {
    return logger(message, ...args);
}

/**
 * Prints a debug information message to the console.
 * @param message The message to be displayed, in sprintf format.
 * @param args Any arguments to be passed to the message sprintf.
 * @returns 
 */
export function info(message: string, ...args: any[]) {
    return debug("%c" + message, ...["color: aqua", ...args])
}

/**
 * Opens a new group
 * @param args Any arguments to be passed to console.log()
 */
export function group(...args: any[]) {
    if (enabled) {
        console.group(...args);
    }
}

/**
 * Ends the last opened group
 */
export function endGroup() {
    if (enabled) {
        console.groupEnd();
    }
}

/**
 * Toggles the logger (if enabled or not).
 */
export function toggleLogger() {
    if (enabled) {
        debuggerModule.enable("pupper");
        debuggerModule.enable("pupper:*");
    } else {
        debuggerModule.disable("pupper");
        debuggerModule.disable("pupper:*");
    }
}

/**
 * Toggles the debug mode (if enabled or not).
 */
export function toggleDebug() {
    enabled = !enabled;

    if (enabled) {
        localStorage.setItem("pupperjs:debug", "1");
    } else {
        localStorage.removeItem("pupperjs:debug");
    }

    toggleLogger();
}

const Debugger = {
    group,
    endGroup,
    enabled,
    toggleDebug,
    info,
    debug,
    extend
} as const;

export default Debugger;

declare global {
    interface Window {
        pDebugger: typeof Debugger
    }
}

if (process.env.NODE_ENV !== "production") {
    toggleLogger();

    window.pDebugger = Debugger;

    console.warn("pupper.js detected a non-production environment.");
    console.warn("The debugger object has been exposed to the window. You can access it by using window.pDebugger (", window.pDebugger, ")");
}