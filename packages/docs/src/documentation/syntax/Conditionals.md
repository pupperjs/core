## Conditionals
<br/>

---

<br/>

### `if`
The tag `if` is used to conditionally render a block.
The block will only be rendered if the directive's expression returns a thruthy value.

```pug
if shibe
    |Shibbers are awesome!
```

<br/>

---

<br/>

### `else`
You can use the `else` tag to indicate an "else block" for `if`:

```pug
button(@click="shibe = !shibe!") Toggle

if shibe
    |Shibbers are awesome!
else
    |🐕😢
```

<br/>

---

<br/>

### `else if`
As the `else if` name suggests, serves as an "else if block" for `if`.
It can also be chained multiple times:

```pug
if dog === "shiba"
    |Shibber!
else if dog === "akita"
    |Akita!
else
    |Not a shibber or an akita.
```