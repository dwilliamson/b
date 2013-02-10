<!DOCTYPE html>
<html lang="en">

	<head>
		<meta name="fragment" content="!">
		<title>Gazoo.cpp</title>
		<link rel="stylesheet" href="Styles/Blog.css">
		<link rel="stylesheet" href="Styles/Main.css">
	</head>
	
	<body id="background">
	
		<div id="menu"></div>
		<div id="mygame"></div>
		<div id="content"></div>
		<div id="info"></div>

		<script language="javascript" src="Code/Extern/dygraph-combined.jgz"></script>
		<script language="javascript" src="Code/Min/TinyBlog.jgz"></script>

		<script type="text/javascript">
			// Setup global disqus variables
			var disqus_shortname = 'gazoo';
			var disqus_identifier = get_url_parameters()["d"];		// There can only be one page with comments so this works fine
		</script>
		
		<?php
			require("Code/Utils.php");
			GenerateBlogPostArray("blog_posts");
		?>

		<script language="javascript">

			// Set an initial history state so that popstate can ignore the call on page load
			if (window.history.replaceState)
				window.history.replaceState("Object or string", null, null);

			// Sort blog posts by date, latest first
			blog_posts.sort();
			blog_posts.reverse();

			var blog_engine = new BlogEngine();
			var archive_page = build_archive_page(blog_posts);


			function post_callback(div)
			{
				div.set_opacity(1);
			}


			// Menu and side bar
			blog_engine.DisplayPosts("#menu", [ "Static/Menu.txt" ], null, post_callback, true)
			blog_engine.DisplayPosts("#mygame", [ "Static/MyGame.txt" ], null, post_callback, true)
			blog_engine.DisplayPosts("#info", [ "Static/SocialNetworks.txt", "Static/LatestPosts.txt", archive_page, "Static/Links.txt" ], null, post_callback, true)


			function display_posts()
			{
				var params = get_url_parameters();
				disqus_identifier = params["d"];

				// Display latest posts only from the front page
				S("#content").empty();
				blog_engine.DisplayPosts("#content", blog_posts, params, post_callback, false);
			}


			display_posts();
			
			window.onpopstate = function (e)
			{
				// The browser changes the title automatically, so reevaluate parameters and diplay posts
				if (e.state)
					display_posts();
			}

		</script>

		<script type="text/javascript">

		  var _gaq = _gaq || [];
		  _gaq.push(['_setAccount', 'UA-2989017-7']);
		  _gaq.push(['_trackPageview']);

		  (function() {
			var ga = document.createElement('script');
			ga.type = 'text/javascript';
			ga.async = true;
			ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
			var s = document.getElementsByTagName('script')[0];
			s.parentNode.insertBefore(ga, s);
		  })();

		</script>
		
	</body>

</html>