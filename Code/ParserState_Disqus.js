function ParserState_Disqus(parser)
{
	this.parser = parser;
	this.name = "Disqus";
	
	this.on_enter = function()
	{
		var params = get_url_parameters();

		if ("d" in params && params["d"] == this.parser.document_id)
		{
			// Show the comment thread if only this post is being displayed
			this.parser.add_html('<br/><br/><br/><div id="disqus_thread">');
			
			(function() {
				var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
				dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';
				(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
			})();
		}
		else
		{
			// Otherwise just show the comment count
			this.parser.add_html('<a href="' + this.parser.document_url + '#disqus_thread" data-disqus-identifier="' + this.parser.document_id + '"></a>');

			(function () {
				var s = document.createElement('script'); s.async = true;
				s.type = 'text/javascript';
				s.src = 'http://' + disqus_shortname + '.disqus.com/count.js';
				(document.getElementsByTagName('HEAD')[0] || document.getElementsByTagName('BODY')[0]).appendChild(s);
			}());
		}
	};

	this.on_exit = function()	
	{
		this.parser.add_html('</div>');
	};

	this.parse = function()
	{
	};
}
