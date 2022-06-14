type TEffect = () => any | Promise<any>;
type TReactiveObj = Record<string | number | symbol, any>;

const effects = new Map<TReactiveObj, TEffect | any>();
let currentEffect: TEffect = null;

export async function effect(effect: TEffect) {
    currentEffect = effect;

    // Calling the effect immediately will make it
    // be detected and registered at the effects handler.
    await effect();

    currentEffect = null;
}

export function reactive(obj: TReactiveObj) {
    return new Proxy(obj, {
        get(target, property) {
            // If detected no current effect
            // or this property is somehow undefined
            if (currentEffect === null || target[property] === undefined) {
                // Ignore
                return target[property];
            }

            // Ignore functions
            if (typeof target[property] === "function") {
                return target[property];
            }

            // If this target has no effects yet
            if (!effects.has(target)) {
                // Add a new effect handler to it
                effects.set(target, {} as any);
            }

            // Retrieves the effects for the current target
            const targetEffects = effects.get(target);

            // If has no effect handler for this property yet
            if (!targetEffects[property]) {
                // Create a new one
                targetEffects[property] = [
                    currentEffect
                ];
            } else {
                // Add the bubble to it
                targetEffects[property].push(currentEffect);
            }

            return target[property];
        },

        set(target, property, value) {
            // JavaScript, for some reason, treats "null" as an object
            if (typeof value === null) {
                target[property] = null;
            } else
            // Only objects can be reactive
            if (typeof value === "object") {
                target[property] = reactive(value);
            } else {
                target[property] = value;
            }

            // If has any effects for the given target
            if (effects.has(target)) {
                const targetEffects = effects.get(target);
                let propEffects = targetEffects[property];

                // If it's a valid array
                if (Array.isArray(propEffects)) {
                    (async () => {
                        for(let effect of propEffects) {
                            await effect();
                        }
                    })();
                }
            }

            return true;
        }
    })
}