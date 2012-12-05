
function BlogEngine()
{
	// Show the selected image in the overlay elements
	show_image = function(element)
	{
		// Get window dimensions
		var window_w = window.innerWidth;
		var window_h = window.innerHeight;

		// Setup the semi-transparent background that should cover the entire image
		S("#image_background")
			.set_width(window_w)
			.set_height(window_h)
			.click(hide_image)
			.show();

		// Force a load of the image by the browser and specify a delegate that responds to the load
		img = new Image();
		img.src = element.href;
		img.src_offset = $(element).offset();
		img.src_width = $(element).width();
		img.src_height = $(element).height();
		img.onload = function()
		{
			// Set the image in the display element
			$("#image_display").attr("src", this.src);

			// Calculate image destination width and height at 60% of the window size
			var img_dest_w = window_w * 0.6;
			var img_dest_h = img.height * (img_dest_w / img.width)
			if (img.height > img.width)
			{
				img_dest_h = window_h * 0.6;
				img_dest_w = img.width * (img_dest_h / img.height)
			}

			// Calculate a centred top-left destination for the window
			var img_dest_t = window_h / 2 - img_dest_h / 2;
			var img_dest_l = window_w / 2 - img_dest_w / 2;

			// Place the image and show it
			S("#image_display")
				.set_top(img_dest_t)
				.set_left(img_dest_l)
				.set_width(img_dest_w)
				.set_height(img_dest_h)
				.click(hide_image)
				.show();

			// Place the border and show it
			S("#image_foreground")
				.set_top(img_dest_t - 5)
				.set_left(img_dest_l - 5)
				.set_width(img_dest_w + 10)
				.set_height(img_dest_h + 10)
				.click(hide_image)
				.show();
		}
	}

	// Hide the image display elements
	hide_image = function()
	{
		S("#image_background").hide();
		S("#image_foreground").hide();
		S("#image_display").hide();
	}

	$(document).ready(function()
	{
		// Create the HTML elements required to display images
		$("body").append('<div id="image_background"></div>')
		$("body").append('<div id="image_foreground"></div>');
		$("body").append('<img id="image_display">');
	});

	DisplayPost = function(params, filename, document_id, post_div, load_all, chain, chain_index)
	{
		// Check to see if the post div is visible before requesting the post contents
		var window_h = window.innerHeight;
		var window_t = window.pageYOffset;
		var div_offset = $(post_div).offset();
		if (load_all == false && div_offset.top > window_t + window_h)
		{
			// Reschedule the load request for this post on each scroll of the window
			if (chain_index < chain.length)
				window.onscroll = bind("DisplayPost", params, filename, document_id, post_div, load_all, chain, chain_index);
			else
				window.onscroll = null;

			return;
		}

		$.get(filename, function(data)
		{
			// Construct the date from the document ID
			var date = null;
			var c = document_id.split('-');
			if (c.length == 6)
				date = new Date(c[0], c[1] - 1, c[2], c[3], c[4], c[5], 0);

			// Construct the URL used to link to this document
			var document_url = location.pathname + "?d=" + document_id;

			// Create a new parser for the post, parse it and add the generated HTML to the document
			parser = new Parser(data, date, document_url, document_id, params);
			parser.parse();
			post_div.html(parser.html);

			// Notify the caller that the post has displayed
			if (post_callback)
				post_callback(post_div)

			// Add an onclick event to each generated image link to show it
			$("a.image").click(function(event){
				show_image(event.currentTarget);
				event.preventDefault();
			});

			// Schedule any remaining posts
			if (chain_index < chain.length)
			{
				var c = chain[chain_index];
				c(chain, chain_index + 1);
			}

		},"html");
	}	

	this.DisplayPosts = function(div_id, blog_posts, params, post_callback, load_all)
	{
		// This launches whenever the document is ready to write to
		$(document).ready(function()
		{
			var display_post_calls = [ ];

			for (i in blog_posts)
			{
				if (typeof blog_posts[i] != "string")
				{
					var html = blog_posts[i].parse();
					$(div_id).append('<div class="post" id="generated">' + html + '</div>');

					if (post_callback)
						post_callback($("#generated"));

					continue;
				}
				
				// Strip the extension from the relative path
				var document_id = blog_posts[i].replace(".txt", "");

				// Default display mode with no parameters is to display blog posts only
				if (params && !("d" in params) && document_id.indexOf("Posts/") != 0)
					continue;

				// Strip the directory prefix from the document ID
				document_id = document_id.replace("Posts/", "");
				document_id = document_id.replace("Static/", "");

				// Check to see if there is a request in the parameters to display a specific page
				if (params && "d" in params && document_id.indexOf(params["d"]) != 0)
					continue;					

				// Add the div for the post first because the AJAX requests for the content will come in out of order
				var post_div_id = "Post" + document_id.replace(/\-/g, "");
				$(div_id).append('<div class="post" id="' + post_div_id + '"></div>');
				var post_div = $("#" + post_div_id);

				// Queue for display
				display_post_calls.push(bind("DisplayPost", params, blog_posts[i], document_id, post_div, load_all));
			}

			if (display_post_calls.length)
			{
				var c = display_post_calls[0];
				c(display_post_calls, 1);
			}
		});
	}
}
