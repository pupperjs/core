## Plain Text
<br/>

---

<br/>

pupper provides four ways of getting plain text — that is, any code or text content that should go, mostly unprocessed, directly into the rendered HTML. They are useful in different situations.

<br/>

Plain text does still use tag and string interpolation, but the first word on the line is not a Pug tag. And because plain text is not escaped, you can also include literal HTML.

<br/>

One common pitfall here is managing whitespace in the rendered HTML.
We'll talk about that at the end of this page.

<br/>

---

<br/>

### Inline in a Tag
The easiest way to add plain text is *inline*.
The first term on the line is the tag itself. Everything after the tag and one space will be the text contents of that tag.
This is most useful when the plain text content is short (or if you don't mind lines running long).

```pug
p This is plain old <em>text</em> content.
```

<br/>

---

<br/>

### Literal HTML
Whose lines are also treated as plain text when they begin with a left angle bracket (`<`), which may occasionally be useful for writing literal HTML tags in places that could otherwise be inconvenient.
For an example, one use case is conditional comments. Since literal HTML tags do not get processes, they do not self-close, unline pupper tags.

```pug
<div>
ul
    li Indenting the ul tag here would make no difference.
    li HTML itself isn't whitespace-sensitive.
</div>
```

<br/>

---

<br/>

### Piped Text
Another way to add plain text is to prefix a line with a pipe character (`|`).
This method is useful for mixing plain text with inline tags, as we discuss later in the Whitespace Control section.

```pug
p
    | The pipe always goes at the beginning of its own line,
    | not counting identation.
```

<br/>

---

<br/>

### Block in a Tag
Often you might want large blocks of text withing a tag.
To do this, just add a dot (`.`) right after the tag declaration.
<br/>
There should be no space between the tag and the dot.
Plain text contents of the tag must be idented one level:

```pug
div
    p This text belongs to the paragraph tag.
    br
    .
        This text belongs to the div tag.
```

<br/>

---

<br/>

### Whitespace Control
Managing the whitespace of the rendered HTML is one of the trickiest parts abount learning pupper.
Don't worry, though, you'll get the hang of it soon enough.

pupper drops the whitespace between tags, but keeps the whitespace inside them.
The value here is that it gives you full control over whether tags and/or plain text should touch.
It even lets you place tags in the middle of words.

```pug
| You put the em
em pha
| sis on the wrong syl
em la
| ble.
```

The trade-off is that it *requires* you to think about and take control over whether tags and text touch.
<br/>
If you need the text and/or tags to touch - perhaps you need a period to appear outside the hyperlink at the end of a sentence - this is easy, as it's basically what happens unless you tell pupper otherwise.

```pug
a ...sentence ending with a link
| .
```

If you need to *add* space, you have a few options:

<br/>

#### Recommended Solutions
You could add one or more empty piped lines - a pipe with either spaces or nothing after it. This will insert whitespace in the rendered HTML.

```pug
| Don't
| 
button#self-destruct touch
| 
| me!
```

If your inline tags don’t require many attributes, you may find it easiest to use tag interpolation, or literal HTML, within a plain text *block*.

```pug
p.
    Using regular tags can help keep your lines short,
    but interpolated tags may be easier to #[em visualize]
    whether the tags and text are whitespace-separated.
```

<br/>

#### Not Recommended
Depending on where you need the whitespace, you could add an extra space at the beginning of the text (after the block indentation, pipe character, and/or tag). Or you could add a trailing space at the *end* of the text.

**NOTE the trailing and leading spaces here:**
```pug
| Hey, check out 
a(href="http://example.biz/kitteh.png") this picture
|  of my cat!
```