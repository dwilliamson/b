function ParserState_Wiki(parser)
{
	this.parser = parser;
	this.name = "Wiki";
	this.table = false;
	
	this.markup_tags =
	[
		// pattern, html tag, current state, first character, consume \n
	 	[ /^\*\*/, "b", false, "*" ],
	 	[ /^__/, "u", false, "_" ],
	 	[ /^--/, "i", false, "-" ],
	 	[ /^\^u/, "sup", false, "^" ],
	 	[ /^\^d/, "sub", false, "^" ],
		[ /^\|\|/, "center", false, "|", true ],
	 	[ /^=====/, "h1", false, "=", true],
	 	[ /^====/, "h2", false, "=", true ],
	 	[ /^===/, "h3", false, "=", true ],
	 	[ /^==/, "h4", false, "=", true ]
	];
	
	url_pattern = /^{[^\|]*\|[^}]*}/;
	img_pattern = /^{{[^}]*}}/;
	title_pattern = /^\<<[^>]*>>/;
	table_open_pattern = /^\n\s*\*/;
	table_item_pattern = /^\n\s*\*/;
	table_close_pattern = /^\n/;

	this.on_enter = function()
	{
	};

	this.on_exit = function()
	{
	};

	this.parse = function()
	{
		// First check all open/close markup tags
		for (i in this.markup_tags)
		{
			markup = this.markup_tags[i];
			if (this.parser.match(markup[0], markup[3]))
			{
				// Exiting?
				if (markup[2])
				{
					this.parser.add_html("</" + markup[1] + ">");
					
					// Consume the newline if requested
					if (markup[4])
						this.parser.consume_newline();
				}
				else
					this.parser.add_html("<" + markup[1] + ">");
					
				// Toggle state
				markup[2] = !markup[2];
				return;
			}
		}

		// Check for image links
		if (url = this.parser.match(img_pattern, "{"))
		{
			images = url[0].slice(2, -2).split("|");
			if (images[1].indexOf("url:") == 0)
				this.parser.add_html('<a href="' + images[1].replace("url:", "") + '" target="new"><img src="' + images[0] + '"></a>');
			else
				this.parser.add_html('<a href="' + images[1] + '" class="image"><img src="' + images[0] + '"></a>');
			return;
		}

		// Check for regular links
		else if (url = this.parser.match(url_pattern, "{"))
		{
			url = url[0].slice(1, -1).split("|");
			if (url[1].indexOf("http") == 0)
				this.parser.add_html('<a href="' + url[1] + '" target="new">' + url[0] + '</a>');

			else
			{
				// No prefix means it's a local page reference
				html = '<a href="javascript:blog_goto(' + "'" + url[1] + "')" + '">' + url[0] + '</a>';
				this.parser.add_html(html);
			}
		}

		// Check for title tags
		else if (title = this.parser.match(title_pattern, "<"))
		{
			title = title[0].slice(2, -2);
			html = '<a href="javascript:blog_goto(' + "'" + this.parser.document_id + "')" + '" class="title">' + title + '</a><br/>';
			this.parser.add_html(html);

			// Static pages don't have valid dates
			if (this.parser.date != null)
				this.parser.add_html('<span class="date">Posted ' + this.parser.date.toLocaleString() + '</span>');
		}

		else if (!this.table && this.parser.match(table_open_pattern, "\n"))
		{
			this.parser.add_html("<ul><li>");
			this.table = true;
		}

		else if (this.table)
		{
			if (this.parser.match(table_item_pattern, "\n"))
			{
				this.parser.add_html("</li><li>");
			}
			
			else if (this.parser.match(table_close_pattern, "\n"))
			{
				this.parser.add_html("</li></ul>");
				this.table = false;
				this.parser.consume_newline();
				return;
			}
		}
				
		c = this.parser.get();
		this.parser.append(c);
	};
}
