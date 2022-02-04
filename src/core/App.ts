export interface AppSettings {
    /**
     * The target element related to this application
     */
    el?: HTMLElement | string
}

export class App {
    constructor(
        protected settings: AppSettings
    ) {

    }
}