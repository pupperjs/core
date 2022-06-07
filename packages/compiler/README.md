![pupper.js icon](https://i.imgur.com/dAuCn4B.png "pupper.js icon")
# @pupperjs/compiler
The compiler for pupper.js component.

This is a BETA project, it can change drastically over time, so use it with caution for now and stay updated! :D

---

# Under the hood
- pupper.js uses [pug](https://github.com/pugjs/pug) as the main language component.
  All the templates are compiled as HTML using pug.
    
  -  A custom pug plugin is used for lexing and parsing the instructions into components.

- It also uses [ts-morph](https://github.com/dsherret/ts-morph) for processing the resulting components code.

- For TypeScript compilation, it uses the default compiler, `tsc`.

- For Sass and Scss, it uses [sass](https://github.com/sass/sass).