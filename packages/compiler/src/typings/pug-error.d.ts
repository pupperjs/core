declare module "pug-error" {
    export default (code: string | number, message: string, props: {
        line: number;
        column: number;
        filename: string;
        src: string;
    }) => Error;
}