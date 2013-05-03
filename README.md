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

Syntax
======

The following sections describe syntax that can be placed in a `.wsd` file for 
input to the ladder processor.

Comments
--------

`# [comment]` Place a comment on a line by iteself, or at the end of any line.  
If you need a `#` in a string, enclose the string in double quotes (`"`).

Participants <a id="participants" />
------------

`participant "[description]" as [name]` Create a new participant in the order 
that the `participant` directive appears in the input file.  The `description` 
is output, and the `name` is what is used for reference in later directives.

Arrows <a id="arrows" />
------

Arrows are draw between participants with open ends, closed ends, solid or 
dashed lines, and may be bi-directional. 

### ends

`<` or `>` closed arrow end

`<<` or `>>` open arrow end

### lines

`-` solid line

`--` dashed line

### examples

`->` solid line with a closed arrow end

`<-->>` dashed line with a closed source arrow and an open destination arrow

Messages
--------

`[participant] [arrow] [participant]` draw a line with [arrows](#arrows) between
two [participants](#participants).  A participant that has not been previously
mentioned will be automatically created.  Note that a message may be of the form
`B -> B`, which produces a self message.

Options
-------

`set [option] [value]` set an option governing the production of the diagram to
the given value.  If the value is omitted, it defaults to `true`.

### Defaults

The following options may be set (followed by their defaults):

 * `arrow_color`: black
 * `arrow_height`: 10
 * `arrow_width`: 15
 * `auto_number`: false
 * `background`: white
 * `block_tab_fill`: gray
 * `block_stroke`: gray
 * `column_width`: 150
 * `font`: DejaVu Sans
 * `line_color`: black
 * `line_width`: 1
 * `rung_color`: black
 * `rung_width`: 1
 * `text_color`: black
 * `text_size`: 13
 * `time_height`: 20

Programmatic Interface
======================

```javascript
var ladder = require('ladder');
ladder.draw("A->B", "pdf", function(error, out) {
	// err is `null` or an `Error`
	// out is a `String` or `Buffer`
});
```

Supported Output Types
======================

 * PDF
 * SVG