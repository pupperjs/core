import { Component, IComponent } from "../core/Component";

/**
 * Used to represent whats is a pupper module
 */
declare module "*.pupper" {
    export default function(data: IComponent): Component;
}