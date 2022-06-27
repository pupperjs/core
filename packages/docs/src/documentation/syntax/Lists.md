## Lists
<br/>

---

<br/>

### `each`
We can use the tag `each` to render a list of items based on an array.
The `each` tag requires a special syntax in the form of `item in items`, where `items` is the source data array and `item` is an alias for the array element being iterated on:

```pug
template
    each item in items
        =item.message
data
    items = [
        {
            message: "Foo"
        },
        {
            message: "Bar"
        }
    ]
```

Inside the `each` scope, template expressions have access to all parent scope properties.
In addition, `each` also supports an optional second alias for the index of the current item:

```pug
template
    each item, index in items
        |#{prefix} - #{index} - #{item.message}
data
    prefix = "Prefix";
    items = [
        {
            message: "Foo"
        },
        {
            message: "Bar"
        }
    ]
```