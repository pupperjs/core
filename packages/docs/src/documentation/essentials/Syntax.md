## Syntax
pupper syntax is based in [pug](https://pugjs.org/api/getting-started.html).

<br/>

### Attributes
It is very semantical and natural to write in pupper.
Tag and attributes look similar to HTML, but with commas separating the attributes. Their values are just regular JavaScript.

```pug
a(href="//google.com") Google
```

Normal JavaScript works fine with components:

```pug
template
    body(class=authenticated ? "authed" : "anon")
data
    authenticated = false
```

### Multi-line Attributes
If you have many attributes, you can also spread them across many lines:

```pug
input(
    type="checkbox",
    name="agreement",
    checked
)
```

!>
    You can use template literals for syntax attributes.
    This is very useful for attributes with really long values:

```pug
input(data-very-long-json=`
    {
        "very-long": "piece of ",
        "data": true
    }
`)
```