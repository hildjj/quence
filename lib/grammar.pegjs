{
	var ast = require('./ast');
	var log = require('log4js').getLogger();
	var diag = new ast.Diagram();
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

advance
	= "advance" WS n:number { diag.addAdvance(location().start.line, n); }

send
	= tm:timepoint? _
	  from:endpoint _  op:arrow _ to:endpoint _ msg:message? _
	  opts:options? {
	  	diag.addMessage(location().start.line, tm, from, op, to, msg, opts);
	}

loop_block
	= "loop" WS p:to_the_end { diag.addBlock(location().start.line, "loop", p); }

opt_block
	= "opt" WS p:to_the_end { diag.addBlock(location().start.line, "opt", p); }

end
	= "end" { diag.endBlock(location().start.line); }

set
	= "set" WS w:word val:(WS val:value {return val;})? { diag.setProp(w, val); }

timepoint
	= w:word _ ":" { return w; }

endpoint
	= nm:word t:target_time? { return diag.addEndpoint(nm, t); }

target_time
	= "@" nw:number_or_word { return nw; }

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
	= ":" _ p:[^[#\n]* { return p.join(''); }

arrow
	= dash:("-" "-"?) right_arr:(">" ">"?) { 
		return new ast.Arrow(null, dash.join(''), right_arr.join('')); 
	} 
	/ left_arr:("<" "<"?) dash:("-" "-"?) right_arr:(">" ">"?) { 
		return new ast.Arrow(left_arr.join(''), dash.join(''), right_arr.join('')); 
	} 

options
	= "[" _ "]"
	/ "[" _ first:opt _ follow:("," _ o:opt {return o;})* _ "]" { 
		var opts = {};
		opts[first[0]] = first[1];
		for (var i=0; i<follow.length; i++) {
			opts[follow[i][0]] = follow[i][1];
		}
		return opts;
	}

opt
	= name:word val:(_ "=" _ v:value {return v;})? {
		return [name, (val === '') ? true : val];
	}

comment
	= "#" [^\n]*

to_the_end 
	= quoted
	/ chars:[^#"\r\n\t]* { 
		return chars.join(''); 
	}

// TODO: escape dquotes
quoted
	= '"' info:[^"]* '"' { return info.join(''); }

qphrase
	= quoted
	/ word
	
word 
	= chars:[a-zA-Z0-9_']+ { return chars.join('').trim(); }

number
	= num:[0-9]+ { return parseInt(num.join(''), 10); }

WS "required whitespace"
	= [ \t]+ {return " "};

_ "optional whitespace"
	= [ \t]* { return " " };

eol
	= "\n"
