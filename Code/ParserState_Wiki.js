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

		function make_url_link(url, allow_new_target, class_name)
		{
			// Assume an external target
			var target = allow_new_target ? 'target="new"' : null;

			// No prefix means it's a local page reference
			if (url.indexOf("http") != 0)
			{
				url = "javascript:blog_goto('" + url + "')";
				target = null;
			}

			// Construct the link
			var link = '<a href="' + url + '"';
			if (class_name)
				link = link + ' class="' + class_name + '"'; 
			if (target)
				link = link + ' ' + target;
			link = link + '>';

			return link;
		}

		// Check for image links
		if (url = this.parser.match(img_pattern, "{"))
		{
			images = url[0].slice(2, -2).split("|");
			url = images[1];

			var is_url_link = url.indexOf("url:") == 0;
			if (is_url_link)
				url = url.replace("url:", "");

			// Convoluted logic that makes up for the lack of the user being able to configure image display
			// TODO: Fix this!
			var is_external_url_link = is_url_link && url.indexOf("http") == 0;
			var class_name = "";
			if (is_external_url_link)
				class_name = null;
			else if (is_url_link)
				class_name = "bordered_image";
			else
				class_name = "image";

			var link = make_url_link(url, is_url_link, class_name);
			this.parser.add_html(link + '<img src="' + images[0] + '"></a>');
			return;
		}

		// Check for regular links
		else if (url = this.parser.match(url_pattern, "{"))
		{
			url = url[0].slice(1, -1).split("|");
			var link = make_url_link(url[1], true);
			this.parser.add_html(link + url[0] + '</a>');
		}

		// Check for title tags
		else if (title = this.parser.match(title_pattern, "<"))
		{
			title = title[0].slice(2, -2);
			var link = make_url_link(this.parser.document_id, false, "title");
			this.parser.add_html(link + title + "</a><br/>");

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
