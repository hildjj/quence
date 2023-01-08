
Create sequence diagrams with a domain-specific language.

```
Usage: quence [-o type] [-v] [-h] FILE...

Options:
  -n  do not add project link to output
  -o  output type [pdf, svg, json]  [string]  [default: "pdf"]
  -v  verbose logging               [boolean]
  -h  Show help                     [boolean]
```

<img src='https://raw.github.com/hildjj/quence/main/doc/small.png' align='right'/>

Small example:

```
set text_color purple

Alice -> Bob: Hello #comment
Bob -> Alice: World
Bob -> Bob: !
```

Installation
============

Use [npm](http://npmjs.org/):

```
npm install -g quence
```

Syntax
======

The following sections describe syntax that can be placed in a `.wsd` file for
input to the quence processor.

Comments
--------

`# [comment]` Place a comment on a line by itself, or at the end of any line.
If you need a `#` in a string, enclose the string in double quotes (`"`).


Participants <a id="participants"></a>
------------

`participant "[description]" as [name]` Create a new participant in the order
that the `participant` directive appears in the input file.  The `description`
is output, and the `name` is what is used for reference in later directives.

<img src='https://raw.github.com/hildjj/quence/main/doc/participant.png' align='right'/>

Example:

```
participant Alice
participant "Bob Cat" as bob
```

Arrows <a id="arrows"></a>
------

Arrows are draw between participants with open ends, closed ends, solid or
dashed lines, and may be bi-directional.

### ends

`<` or `>` closed arrow end

`<<` or `>>` open arrow end

You can also use the `#` indicator to show that a packet is lost.
This will create an "X" arrowhead and only draw the line halfway
across.


### lines

`-` solid line

`--` dashed line

Example:

<img src='https://raw.github.com/hildjj/quence/main/doc/arrows.png' align='right'/>

```
# A "normal" message from A to B
A -> B

# An "exciting" message between A and B
# No, this doesn't have any defined meaning, as far as I know
A<-->>B
```

Messages
--------

The minimum message looks like `participant arrow participant`, but a full description is:

```
[label:] participant[@time] arrow participant[@time] [:title] [[message options]]
```

Draw a line with
[arrows](#arrows) between two [participants](#participants).  A participant
that has not been previously mentioned will be automatically created.  Note
that a message may be of the form `B -> B`, which produces a self message.

### Title

<img src='https://raw.github.com/hildjj/quence/main/doc/title.png' align='right'/>

A message can have a title that will be drawn over the message line.  The title
will be justified toward the start of the message, or in the middle for
bi-directional messages.

Example:

```
A->B: The title
```

<img src='https://raw.github.com/hildjj/quence/main/doc/timestamps.png' align='right'/>

### Timestamps

Each message start time can have a timestamp associated with it by prefixing
the messagewith `label:`.  Subsequent messages can be declared to start or end
at a given label by suffixing the participant name with `@time`, where `time` is
the label from a previous message.
This will usually result in a diagonal line.

Example:

```
early: A-->>B
late: B-->>A
A@early->B@late
```

### Message options

<img src='https://raw.github.com/hildjj/quence/main/doc/messages.png' align='right'/>

Message options modify the message, and are of the form `name [= value]`, with
multiple options separated by a comma (`,`).  The following message options
may be set:

 * `duration`: The number of time slices that this message takes up.  If this is
    not `1`, a diagonal line will result.  [Default: `1`]
 * `advance`: The number of time slices to advance the clock after this message.
    This is useful after a flurry of crossing diagonal lines. [Default: `1`]

Example:

```
A->B [duration=2, advance=2]
B->A [duration=2]
```

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
 * `font`: Helvetica
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
var quence = require('quence');
quence.draw("A->B", "pdf", function(error, out) {
	// err is `null` or an `Error`
	// out is a `String` or `Buffer`
});
```

Supported Output Types
======================

 * PDF
 * SVG
 * JSON

Quence was formerly known as "arrow", until I was asked very nicely to let
another project use that name.

[![Tests](https://github.com/hildjj/quence/actions/workflows/node.js.yml/badge.svg)](https://github.com/hildjj/quence/actions/workflows/node.js.yml)
[![Coverage Status](https://coveralls.io/repos/github/hildjj/quence/badge.svg?branch=main)](https://coveralls.io/github/hildjj/quence?branch=main)
