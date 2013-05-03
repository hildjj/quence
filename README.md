Create sequence diagrams with a domain-specific language.

```
Usage: ladder [-o type] [-v] [-h] FILE...

Options:
  -o  output type [pdf, svg, json]  [string]  [default: "pdf"]
  -v  verbose logging               [boolean]
  -h  Show help                     [boolean]
```

Small example:

```
set text_color purple

Alice -> Bob: Hello #comment
Bob -> Alice: World
Bob -> Bob: !
```

![small example](https://github.com/hildjj/ladder/raw/master/examples/small.png "Small example")
