{
	var Ladder = require('./ladder-diagram');
	var json = {
		title: null,
		participants: [],
		data: []
	}
}
start
 	= actions { return json; }

actions
 	= _ act_comment? (eol _ act_comment)*

act_comment
	= action _ comment?

action
 	= title
 	/ participant
 	/ advance
 	/ send
 	/ set
 	/ comment
 	/ _

title
	= "title" p:phrase {
		if (json.title) {
            throw new Error("Title already specified as: " + json.title);
        }
        json.title = p;
	}

participant
	= "participant" WS q:qphrase WS "as" WS w:word {
		json.participants.push([w,q]);
	}
	/ "participant" WS w:word {
		json.participants.push([w,w]);
	}

advance
	= "advance" WS n:number {
		json.data.push([Ladder.ADVANCE, n]);
	}

send
	= tm:timepoint? _ from:word _ op:arrow _ to:word _ msg:message? _ opts:options? {
		if (opts === '') {
			opts = {};
		}
		if (tm !== '') {
			opts.timepoint = tm;
		}
		opts.line_ct__ = line();
		json.data.push([op, from, to, msg, opts]);
	}

set
	= "set" WS w:word WS val:[^\n#]* { json[w] = val.join('').trim(); }

timepoint
	= w:word _ ":" { return w; }

message
	= ":" _ p:[^[#\n]* { return p.join(''); }

arrow
	= "->" { return Ladder.ARROW; }
	/ "<->" { return Ladder.DARROW; }

options
	= "[" _ first:opt? _ follow:("," _ o:opt {return o;})* _ "]" { 
		var opts = {};
		if (first !== '') {
			opts[first[0]] = first[1];

			for (var i=0; i<follow.length; i++) {
				opts[follow[i][0]] = follow[i][1];
			}
		}

        if (opts.duration !== undefined) {
            opts.duration = parseInt(opts.duration, 10);
        }
        if (opts.advance !== undefined) {
            opts.advance = parseInt(opts.advance, 10);
        }

		return opts;
	}

opt
	= name:word value:(_ "=" _ word)? {
		return [name, Array.isArray(value) ? value[3] : true];
	}

comment
	= "#" [^\n]*

phrase
	= words:(WS word)+ { 
		//console.log('phrase', words);
		return words.map(function(w) { return w[1] }).join(' '); 
	}

qphrase
	= '"' info:[^"\n]* '"' { return info.join(''); }
	/ word
	
word 
	= chars:[a-zA-Z0-9_'@-]+ { return chars.join(''); }

number
	= num:[0-9]+ { return parseInt(num.join(''), 10); }

WS "required whitespace"
	= [ \t]+ {return " "};

_ "optional whitespace"
	= [ \t]* { return " " };

eol
	= "\n"
