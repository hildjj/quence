{{
  // @ts-nocheck
  import * as ast from './ast.js'
}}
{
  const diag = new ast.Diagram();
}
start
  = actions { diag.compute(); return diag; }

actions
  = _ act_comment? (eol _ act_comment)*

act_comment
  = action _ comment?

action
  = title
  / participant
  / advance
  / note
  / set
  / loop_block
  / opt_block
  / end
  / send
  / comment
  / _

title
  = "title" WS p:to_the_end { diag.setTitle(p); }

participant
  = "participant" WS q:qphrase WS "as" WS w:word {
    diag.parts.add(w, q);
  }
  / "participant" WS w:word {
    diag.parts.add(w);
  }

note
  = "note" WS ep:endpoint _ msg:message { diag.addNote(location().start.line, ep, msg); }

advance
  = "advance" WS n:number { diag.addAdvance(location().start.line, n); }

send
  = tm:timepoint? _
    from:endpoint _  op:arrow _ to:endpoint _ msg:message? _
    props:options? {
      diag.addMessage(location().start.line, tm, from, op, to, msg, props);
  }

loop_block
  = "loop" WS p:to_the_end { diag.addBlock(location().start.line, "loop", p); }

opt_block
  = "opt" WS p:to_the_end { diag.addBlock(location().start.line, "opt", p); }

end
  = "end" { diag.endBlock(location().start.line); }

set
  = "set" WS w:prop val:(WS @value)? {
    diag.setProp(w, val);
  }

prop
  = w:word {
    if (!diag.validProp(w)) {
      error(`Unknown property: "${w}"`)
    } else {
      return w
    }
  }

timepoint
  = @word _ ":"

endpoint
  = nm:word t:target_time? { return diag.addEndpoint(nm, t); }

target_time
  = "@" @number_or_word

number_or_word
  = number
  / word

bool_number_or_word
  = bool
  / number
  / word

value
  = quoted
  / bool
  / number
  / word

bool
  = "true" {return true;}
  / "false" {return false;}

message
  = ":" _ s:("\\" @EscapeSequence / [^\[#\r\n])* {
    return s.join('')
  }

arrow
  = dash:$("-" "-"?) right_arr:$(">" ">"?) {
    return new ast.Arrow(null, dash, right_arr);
  }
  / dash:$("-" "-"?) right_arr:"#" {
    return new ast.Arrow(null, dash, '#')
  }
  / left_arr:$("<" "<"?) dash:$("-" "-"?) right_arr:$(">" ">"?) {
    return new ast.Arrow(left_arr, dash, right_arr);
  }

options
  = "[" _ "]" { return null }
  / "[" _ first:opt _ follow:("," _ @opt)* _ "]" {
    const opts = {};
    opts[first[0]] = first[1];
    for (let i=0; i<follow.length; i++) {
      opts[follow[i][0]] = follow[i][1];
    }
    return opts;
  }

opt
  = name:word val:(_ "=" _ @value)? {
    return [name, (val === '') ? true : val];
  }

comment
  = "#" [^\n]*

to_the_end
  = quoted
  / n:not_end* { return n.join('') }

not_end
  = "\\" @EscapeSequence
  / [^#"\r\n\t]

qphrase
  = quoted
  / word

quoted
  = '"' q:qchar* '"' { return q.join('') }

qchar
  = "\\" @EscapeSequence
  / [^"]

EscapeSequence
  = SingleEscapeCharacter
  / HexEscapeSequence
  / UnicodeEscapeSequence

SingleEscapeCharacter
  = "'"
  / '"'
  / "\\"
  / "n"  { return "\n"; }
  / "r"  { return "\r"; }
  / "t"  { return "\t"; }

HexEscapeSequence
  = "x" digits:$( HexDigit HexDigit ) {
      return String.fromCharCode(parseInt(digits, 16));
    }

// Close to "is this a valid JS identifier
word
  = s:word_start c:word_continue* { return [s, ...c].join('') }

word_start
  = "\\" @UnicodeEscapeSequence
  / @w:not_syntax &{ return /[$_\p{ID_Start}]/u.test(w) }

word_continue
  = "\\" @UnicodeEscapeSequence
  / @w:not_syntax &{
    return /[$_\u200C\u200D\p{ID_Continue}]/u.test(w)
  }

not_syntax
  = [^ \t\r\n"@:#=,<>\[\]-]

UnicodeEscapeSequence
  = "u" digits:$( HexDigit HexDigit HexDigit HexDigit ) {
      return String.fromCharCode(parseInt(digits, 16));
    }
  / "u{" digits:$HexDigit+ "}" {
    return String.fromCodePoint(parseInt(digits, 16));
  }

number
  = num:$("-"? [0-9]+) { return parseInt(num, 10); }

HexDigit
  = [0-9a-f]i

WS "required whitespace"
  = [ \t]+ {return " "}

_ "optional whitespace"
  = [ \t]* { return " " }

eol
  = "\n"
