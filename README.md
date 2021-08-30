![pupper.js icon](https://i.imgur.com/dAuCn4B.png "pupper.js icon")
# pupper.js
pupper.js is a reactive template engine based in pugjs.

This is a BETA project, it can change drastically over time, so use it with caution for now and stay updated! :D

---

# Basic syntax
pupper.js is based in pugjs, you can learn about pugjs's syntax [here](https://pugjs.org/language/attributes.html).

There's some new syntax added to use the reactivity:

- `{{ variable }}` Renders the contents of `variable` as text, replacing HTML entities with escaped entities.
- `{- variable -}` Renders the literal content of `variable` as-is

---

# How to use
You can integrate pupper.js to your application by using one of the given loaders that compiles `.pupper` files into Javascript:
- [@pupperjs/webpack-loader](https://github.com/pupperjs/webpack-loader)

---

Or, you can integrate using the API:
```javascript
const pupper = require("@pupperjs/core");
const Renderer = pupper.Renderer;

// Compiles the template to a string
const template = pupper.compileToStringSync(/*pupper*/`
    .test
        span.hello-world(id={{ id }})
            ={- content -}
`);

// Create a renderer (view) with some starting data
const renderer = new Renderer(template, {
    id: "the-id",
    content: "Hello, beautiful world!"
});

/**
 * <div class="test">
 *      <span class="hello-world" id="the-id">
 *          Hello, beautiful world!
 *      </span>
 * </div> 
 */
renderer.renderToString();
```