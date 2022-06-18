![pupper.js icon](https://i.imgur.com/dAuCn4B.png "pupper.js icon")
# pupper.js
pupper.js is a reactive framework based in pugjs.

This is a BETA project, it can change drastically over time, so use it with caution for now and stay updated! :D

---

# Basic syntax
pupper.js syntax is based in pugjs.
You can learn about pugjs's syntax [here](https://pugjs.org/language/attributes.html).

#### Tags and attributes
```pug
//- <div class="classname" data-id="1"></div>
.classname(data-id="1")

//- <div id="id" class="class"></div>
#id.class

//- <span class="with-class" id="and-id"></span>
span.with-class#and-id

//- pupper already know if an element tag can be auto-closed
//- <input name="test />
input(name="test")
```

#### Conditional
```pug
if conditional
    |This will be shown if `conditional` is met
else
    |This will be shown if `conditional` is not met
```

#### Iteration
```pug
each item in items
    //- Will render the item name for each item
    =item.name
```

---

# How to use
You can integrate pupper.js to your application by using one of the given loaders that compiles `.pupper` files into Javascript:
- [@pupperjs/webpack-loader](https://github.com/pupperjs/core/tree/master/packages/webpack-loader)

---

*template.pupper*
```pug
template
    .test
        span.hello-world(id=id)
            =content

data
    id="the-id"
    content="Hello, beautiful world!"
```

*index.js*
```javascript
const template = require("./template.pupper");

const app = document.createElement("div");
document.body.appendChild(app);

/**
 * Will append the following inside the "app" container:
 * 
 * <div class="test">
 *      <span class="hello-world" id="the-id">
 *          Hello, beautiful world!
 *      </span>
 * </div> 
 */
template.mount(app);
```