

function ParserState_Literal(parser)
{
	this.parser = parser;
	
	this.on_enter = function() { }
	this.on_exit = function() { }
	
	this.parse = function()
	{
		c = this.parser.get();
		this.parser.html += c;
	}
}

function Parser(data, date, document_url, document_id, params)
{
	this.date = date;
	this.document_url = document_url;
	this.document_id = document_id;
	this.state_map = { };
	this.state_stack = [ ];
	this.script = data;
	this.html = "";
	this.pos = 0;
	this.view_html = params && "viewhtml" in params;
	this.view_codewp = params && "viewcodewp" in params;

	this.get = function()
	{
		return this.script[this.pos++];
	};
	
	this.match = function(pattern, fc)
	{
		// This first check is very important because creating a substring and matching multiple
		// regex patterns is very slow and a bit of a silly thing to do when you're writing
		// a parser. It checks to see if the first character in the pattern matches and exits
		// early if so. This gives almost a 10x speed increase to parsing!
		if (fc && this.script[this.pos] != fc)
		{
			return null;
		}
		
		cursor = this.script.substr(this.pos);
		match = pattern.exec(cursor);
		
		if (match != null)
		{
			this.pos += match[0].length;
			return match;
		}
		
		return null;
	};
	
	this.consume_newline = function()
	{
		// Recognise the most common forms of newline
		if (this.script[this.pos] == "\n")
			this.pos++;
		else if (this.script[this.pos] == '\r' && this.script[this.pos + 1] == "\n")
			this.pos += 2;
	}
	
	this.add_html = function(text)
	{
		if (this.view_html)
			this.append(text);
		else
			this.html += text;
	}

	this.append = function(text)
	{
		for (i in text)
		{
			switch (text[i])
			{
			case ("<"): this.html += "&lt;"; break;
			case (">"): this.html += "&gt;"; break;
			case ("\n"): this.html += "<br>"; break;
			case ("\r"): break;
			case ("\t"): this.html += "&nbsp;&nbsp;&nbsp;&nbsp;"; break;
			default: this.html += text[i];
			}
		}
	};

	this.parse_tag = function()
	{
		tag = this.match(/^\[\/?[A-Za-z]*\]/, "["); 
		if (tag == null)
		{
			return;
		}
		
		// Strip the square brackets
		tag = tag[0].slice(1, -1);
		
		// Identify and strip the exit slash
		exit = tag[0] == "/";
		tag = tag.substr(exit);
		
		// Switch state if it's known
		if (tag in this.state_map)
			this.switch_state(this.state_map[tag], exit);
	};

	this.switch_state = function(state, exit)
	{
		if (exit)
		{
			this.current_state.on_exit();
			this.state_stack.pop();
			this.current_state = this.state_stack[this.state_stack.length - 1];
		}
		else
		{
			st = new state(this);
			this.state_stack.push(st);
			this.current_state = st;
			this.current_state.on_enter();
		}
	};
	
	this.parse = function()
	{
		if (this.view_html)
			this.html += '<div class="viewhtml">';
			
		while (this.pos < this.script.length)
		{
			this.parse_tag();
			this.current_state.parse();
		}
		
		if (this.view_html)
			this.html += '</div>';
			
		return this.html;
	}

	this.switch_state(ParserState_Wiki, false);
	this.state_map["code"] = ParserState_Code;
	this.state_map["lit"] = ParserState_Literal;
	this.state_map["disqus"] = ParserState_Disqus;
	this.state_map["eq"] = ParserState_Equation;
}
