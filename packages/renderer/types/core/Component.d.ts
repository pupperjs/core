import { DOMParser } from "./DomParser";
/**
 * Represents a slot.
 */
interface Slot {
    /**
     * The comment holding the slot position.
     */
    container: HTMLElement | Comment;
    /**
     * All fallback nodes
     */
    fallbackNodes: Node[];
}
/**
 * Represents a component's data.
 */
interface IComponent<TData extends Record<string, any>, TMethods extends Record<string, CallableFunction>> {
    /**
     * Component-related
     */
    /**
     * The function that renders the template HTML.
     */
    render?: (...args: any[]) => string;
    /**
     * Any data to be passed to the template.
     */
    data?: TData | (() => TData);
    /**
     * Any methods that can be called from the component.
     */
    methods?: TMethods;
    /**
     * Events
     */
    /**
     * Called when the component is mounted
     */
    created?: (this: PupperComponent) => any;
    /**
     * Called when the component is mounted.
     */
    mounted?: (this: PupperComponent) => any;
}
export declare class PupperComponent {
    /**
     * The component properties.
     */
    protected component: IComponent<any, any>;
    static create<TMethods extends Record<string, CallableFunction>, TData extends Record<string, any>>(component: IComponent<TData, TMethods>): PupperComponent & TMethods;
    /**
     * A unique identifier for this component.
     */
    protected $identifier: string;
    /**
     * All the data that will be passed to the renderer and Alpine.
     */
    private $data;
    /**
     * Any slots references.
     */
    $slots: Record<string, Slot>;
    /**
     * Any templates references.
     */
    $templates: Record<string, CallableFunction>;
    /**
     * Any component references.
     */
    $refs: Record<string, HTMLElement>;
    protected parser: DOMParser;
    constructor(
    /**
     * The component properties.
     */
    component: IComponent<any, any>);
    /**
     * Registers a single template.
     * @param templateName The template name.
     * @param template The template render function.
     */
    registerTemplate(templateName: string, template: CallableFunction): void;
    /**
     * Replaces an element with a comment placeholder element.
     * @param element The element to be replaced.
     * @returns
     */
    private replaceWithCommentPlaceholder;
    /**
     * Renders a template and return the rendered child nodes.
     * @param template The template name to be rendered
     * @param data The template data
     * @returns
     */
    renderTemplate(template: string): NodeListOf<ChildNode>;
    /**
     * Renders a template string into a template tag with a div with [pup] attribute.
     * @param string The template string to be rendered.
     * @returns
     */
    private renderStringToTemplate;
    /**
     * Renders the template function into a div tag.
     */
    render(data?: Record<string, any>): HTMLElement;
    /**
     * Renders and mounts the template into a given element.
     * @param target The target element where the element will be mounted.
     * @returns
     */
    mount(target: HTMLElement | Slot): Promise<HTMLElement>;
}
export {};
