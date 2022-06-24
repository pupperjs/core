## Introduction

### What is pupper?
pupper is a reactive JavaScript framework and template engine used for building user interfaces.
It compiles to standard HTML, CSS and JavaScript, and provides a component-based programming model that helps you efficiently develop user interfaces.

Here is a minimal example:

```pug
template
    button(@click="count++")
        |Count is #{count}
data
    count = 0
style
    button {
        font-weight: bold;
    }
```

The above example demonstrates the two core features of pupper:

- **Declarative Rendering:** pupper extends pug with a template syntax that allows us to declaratively describe HTML output based on JavaScript state.

- **Reactivity:** pupper automatically tracks JavaScript state changes and efficiently updates the DOM when changes happen.

- **Single-file Components:** We author pupper components using a pug-like file format called **Single-File Component** (also known as `*.pupper` files, abbreviated as **SFC**).
A pupper SFC, as the name suggests, encapsulates the component's logic (JavaScript), template (pug), and styles (Sass or CSS) in a single file.

<br/>

---

<br/>

### API Styles
pupper components can be authored in three different API styles: Declarative API and Options API.

<br/>

#### Declarative API
With Declarative API, we define a component's logic using logical tags.
For example, imports and top-level variables / functions declared in are directly usable in the template.

Here is a component, but using Composition API and declarations instead:

```pug
template
    button(@click="increment()")
        |Count is #{count}
data
    count = 0
style
    button {
        font-weight: bold;
    }
implementation
    when#mounted
        console.log("The initial count is:", this.count);

    #increment
        this.count++;
```

#### Options API
With Options API, we define a component's logic using an exported object of options such as data, methods, and mounted.
Properties defined by options are exposed on this inside functions, which points to the component instance:

Here is a component, with the exact same template, but using Options API:

```pug
template
    button(@click="increment()")
        |Count is #{count}
style
    button {
        font-weight: bold;
    }
script
    export default {
        data: {
            count: 0
        },
        methods: {
            increment() {
                this.count++;
            }
        },
        mounted() {
            console.log("The initial count is:", this.count);
        }
    }
```