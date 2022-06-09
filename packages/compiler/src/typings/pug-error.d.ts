declare module "pug-error" {
    declare interface IPugError extends Error {
        src: string;
        line: number;
        column: number;
        filename: string;
    }

    export default function PugError(code: string | number, message: string, props: {
        line: number;
        column: number;
        filename: string;
        src: string;
    }): IPugError;
}