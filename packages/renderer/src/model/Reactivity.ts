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
            if (currentEffect === null) {
                return target[property];
            }

            if (!effects.has(target)) {
                effects.set(target, {} as any);
            }

            const targetEffects = effects.get(target);

            if (!targetEffects[property]) {
                targetEffects[property] = [];
            }

            targetEffects[property].push(currentEffect);

            return target[property];
        },

        set(target, property, value) {
            // Only objects can be reactive
            if (typeof value === "object") {
                target[property] = reactive(value);
            }

            if (effects.has(target)) {
                const targetEffects = effects.get(target);

                if (Array.isArray(targetEffects[property])) {
                    (async () => {
                        for(let effect of targetEffects[property]) {
                            await effect();
                        }
                    })();
                }
            }

            return true;
        }
    })
}