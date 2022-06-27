## Tags
<br/>

---

<br/>
By default, text at the start of a line (or after only white space) represents an HTML tag. Indented tags are nested, creating the tree structure of HTML.

```pug
ul
    li Item A
    li Item B
    li Item C
```

pupper also knows which elements are self-closing, like `img`, `meta`, `link` and `br`, but if you want to explicitly self close a tag, you can append the `/` character. Only do this if you know what you're doing.

```pug
foo/
foo(bar="baz")/
```

<br/>

### Block Expansion
To save space, pupper provides an inline syntax for nested tags:

```pug
a: img
```

<br/>

### Rendered Whitespace
Whitespace is removed from the beginning and end of tags, so that you have control over whether the rendered HTML elements touch or not. Whitespace control is generally handled via plain text.