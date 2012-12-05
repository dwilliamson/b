function ParserState_Equation(parser)
{
	this.parser = parser;
	this.name = "Equation";
	
	this.markup_tags =
	[
		// pattern, html tag, current state, first character, consume \n
	 	[ /^_/, "sub", "/sub", false, "_" ],
	 	[ /^\^u/, "sup", "/sup", false, "^" ],
	 	[ /^\|\|/, "table style='margin-top:0.5em; margin-bottom:0.5em; text-align:center;' cellpadding='0' cellspacing='0'", "/table", false, "|" ],
	 	[ /^--/, "tr", "/tr", false, "-" ],
	 	[ /^\\\\/, "td rowspan='2'", "/td", false, "\\" ],
	 	[ /^\\_/, "td style='border-top:solid 1px black;'", "/td", false, "\\" ],
	 	[ /^\\/, "td", "/td", false, "\\" ]
	];

	this.replacement_tags =
	[
		// pattern, html, first character
	 	[ /^\*/, "<span class='equation_sym'>&nbsp;&#183;</span>", "*" ],
	 	[ /^\^/, "&nbsp;&#215;", "^" ],
	 	[ /^theta/, "&#952;", "t" ],
	 	[ /^sum/, "&sum;", "s" ],
	 	[ /^SUM/, "<span class='equation_large'>&sum;</span>", "S" ],
	];
	
	this.on_enter = function()
	{
		this.parser.add_html('<span class="equation">');
	};

	this.on_exit = function()
	{
		this.parser.add_html('</span>');
	};

	this.parse = function()
	{
		// First check all open/close markup tags
		for (i in this.markup_tags)
		{
			markup = this.markup_tags[i];
			if (this.parser.match(markup[0], markup[4]))
			{
				// Exiting?
				if (markup[3])
					this.parser.add_html("<" + markup[2] + ">");
				else
					this.parser.add_html("<" + markup[1] + ">");
					
				// Toggle state
				markup[3] = !markup[3];
				return;
			}
		}

		// Check all replacement tags
		for (i in this.replacement_tags)
		{
			replacement = this.replacement_tags[i];
			if (this.parser.match(replacement[0], replacement[2]))
			{
				this.parser.add_html(replacement[1]);
				return;
			}
		}

		c = this.parser.get();
		this.parser.append(c);
	};
}
