function ParserState_Code(parser)
{
	this.parser = parser;
	this.name = "Code";
	
	cpp_tokens = set
	(
			"#define","#undef","#if","#ifdef","#ifndef","#elif","#endif","#include",
			"#pragma",
			"void","bool","char","short","long","int","float","double","unsigned",
			"signed","do","while","return","if","else","switch","case","default","for",
			"break","continue","goto","static","extern","inline","const","mutable",
			"volatile","template","typename","typedef","typeid","namespace","using",
			"class","struct","friend","union","enum","public","private","protected",
			"try","catch","throw","const_cast","static_cast","dynamic_cast",
			"reinterpret_cast","new","delete","sizeof","true","false","this","explicit",
			"virtual","operator","Dim","End","While","If","Try","Catch","As","Is","And"
	);
	
	comment_open_pattern = /^\/\//;
	vb_comment_open_pattern = /^'/;
	comment_pattern = /^[^\n]*/;
	string_open_pattern = /^\"/;
	string_pattern = /^[^\"]*/;
	id_pattern = /^[#A-Za-z_][A-Za-z_]*/;
	
	this.on_enter = function()
	{
	    if (this.parser.view_codewp)
	        this.parser.add_html('<pre lang="cpp" escaped="true">');
	    else
		    this.parser.add_html('<div class="code">');
	};

	this.on_exit = function()	
	{
	    if (this.parser.view_codewp)
	        this.parser.add_html('</pre>');
	    else
		    this.parser.add_html('</div>');
		    
		this.parser.consume_newline();
	};
	
	append_span = function(cls, text)
	{
		this.parser.add_html('<span class="' + cls + '">');    
		this.parser.append(text);
    	this.parser.add_html('</span>');
	};

	this.parse = function()
	{
	    if (this.parser.view_codewp)
	    {
	        // Output HTML entities literally
		    c = this.parser.get();
			switch (c)
			{
			case ("<"): this.parser.append("&amp;lt;"); break;
			case (">"): this.parser.append("&amp;gt;"); break;
			default: this.parser.append(c);
			}
		    return;
	    }
	    
	    // Match comments
	    if (this.parser.match(comment_open_pattern, "/"))
	    {
		    comment = this.parser.match(comment_pattern);
		    this.parser.pos++;
		    append_span("comment", "//" + comment[0]);
		    this.parser.add_html("<br>");
	    }
	    else if (this.parser.match(vb_comment_open_pattern, "'"))
	    {
		    comment = this.parser.match(comment_pattern);
		    this.parser.pos++;
		    append_span("comment", "'" + comment[0]);
		    this.parser.add_html("<br>");
	    }

	    // Match strings
	    else if (this.parser.match(string_open_pattern, "\""))
	    {
		    text = this.parser.match(string_pattern);
		    this.parser.pos++;
		    append_span("string", '"' + text + '"');
	    }
		
	    // Match IDs that may or may not be keywords
	    else if (token = this.parser.match(id_pattern))
	    {
		    if (token[0] in cpp_tokens)
			    append_span("keyword", token[0]);
		    else
			    this.parser.append(token[0]);
	    }
		
		c = this.parser.get();
		this.parser.append(c);
	};
}
