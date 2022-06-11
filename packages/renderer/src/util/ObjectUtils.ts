/**
 * Checks if a subject is numeric.
 * @param subject The subject to be checked.
 * @returns 
 */
export function IsNumeric(subject: any) {
    return !Array.isArray(subject) && !isNaN(subject);
}

/**
 * Checks if a subject is an object.
 * @param subject The subject to be checked.
 * @returns 
 */
export function IsObject(subject: any) {
    return typeof subject === "object" && !Array.isArray(subject);
}