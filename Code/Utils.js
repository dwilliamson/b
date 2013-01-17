
// Creates the Javascript equivalent of a set
function set()
{
	var result = { };
	for (i = 0; i < arguments.length; i++)
	{
		result[arguments[i]] = 1;
	}
	return result;
}


function get_url_parameters()
{
	// Build a dictionary out of the URL parameters
	var url = location.href.split('#')[0]
	var url_params = url.slice(url.indexOf('?') + 1).split('&');
	var params = { }
	for (i in url_params)
	{
		var data = url_params[i].split('=');
		if (data[1] != "")
			params[data[0]] = data[1];
	}
	
	return params;
}


function build_archive_page(blog_posts)
{
	var month_strings = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
	var archive_months = { };
	
	for (i in blog_posts)
	{
		// Get the filename on its own
		var document_id = blog_posts[i];
		document_id = document_id.replace("Static/", "");
		document_id = document_id.replace("Posts/", "");

		// Split based on date separator and ignore files without dates
		var bits = document_id.split("-");
		if (bits.length < 2)
			continue;

		// Construct a unique name for this year/month
		var name = month_strings[parseInt(bits[1], 10) - 1] + ", " + bits[0]

		// Keep count of posts per each unique year/month pair
		if (!(name in archive_months))
			archive_months[name] = [ 1, document_id.substr(0, 7) ];
		else
			archive_months[name][0]++;
	}

	// Build wiki-text for the archive page
	var archives_page = "[lit]<div style='font-size:8pt; line-height:1.3em;'>[/lit]**Archives**\n"
	for (name in archive_months)
	{
		count = archive_months[name][0];
		link = archive_months[name][1];
		archives_page += "{" + name + " (" + count + ")|" + link + "}\n";
	}
	archives_page += " [lit]</div>[/lit]"
	
	return new Parser(archives_page, null, "");
}


function bind()
{
	// No closure to define?
	if (arguments.length == 0)
		return null;

	// Locate the function and its scope within the argument list
	var scope = window;
	var func = arguments[0];
	var start = 1;
	if (typeof(arguments[0]) != "string")
	{
		scope = arguments[0];
		func = arguments[1];
		start = 2;
	}

	// Convert the arguments list to an array
	var arg_array = Array.prototype.slice.call(arguments, start);

	// Lookup the function and mark where argument concatenation begins
	func = scope[func];
	start = arg_array.length;

	return function()
	{
		// Concatenate incoming arguments
		for (var i = 0; i < arguments.length; i++)
			arg_array[start + i] = arguments[i];

		// Call the function in the given scope with the new arguments
		return func.apply(scope, arg_array);
	}
}


function cancel_default_action(e)
{
	var evt = e ? e:window.event;
	if (evt.preventDefault) evt.preventDefault();
	evt.returnValue = false;
	return false;
}


function Selector(name_or_node)
{
	this.Node = name_or_node;

	if (typeof(name_or_node) == "string")
	{
		if (name_or_node[0] == "#")
			this.Node = document.getElementById(name_or_node.substr(1));
		else
			this.Node = document.getElementsByTagName(name_or_node)[0];
	}

	this.empty = function()
	{
		while (this.Node.firstChild)
			this.Node.removeChild(this.Node.firstChild);
		return this;
	}

	this.append = function(html)
	{
		var div = document.createElement("div");
		div.innerHTML = html;
		this.Node.appendChild(div);
		return this;
	}

	this.set_html = function(html)
	{
		this.Node.innerHTML = html;
		return this;
	}

	this.set_attr = function(attr, value)
	{
		this.Node.setAttribute(attr, value);
	}

	this.show = function()
	{
		this.Node.style.display = "inline";
		return this;
	}

	this.hide = function()
	{
		this.Node.style.display = "none";
		return this;
	}

	this.offset = function()
	{
        var x = 0, y = 0;
        for (var node = this.Node; node != null; node = node.offsetParent)
        {
                x += node.offsetLeft;
                y += node.offsetTop;
        }

        return { top: y, left: x };
	}

	this.width = function()
	{
		return this.Node.offsetWidth;
	}

	this.scroll_width = function()
	{
		return this.Node.scrollWidth;
	}

	this.set_left = function(left)
	{
		this.Node.style.left = left + "px";
		return this;
	}

	this.set_top = function(top)
	{
		this.Node.style.top = top + "px";
		return this;
	}

	this.set_width = function(width)
	{
		this.Node.style.width = width + "px";
		return this;
	}

	this.set_height = function(height)
	{
		this.Node.style.height = height + "px";
		return this;
	}

	this.set_opacity = function(opacity)
	{
		this.Node.style.opacity = opacity;
		return this;
	}

	this.click = function(fn)
	{
		this.Node.onclick = fn;
		return this;
	}
}


function S(name)
{
	return new Selector(name);
}


get_ajax_document = function(filename, callback)
{
	// Create a new object for each request
	var req;
	if (window.XMLHttpRequest)
		req = new XMLHttpRequest();
	else
		req = new ActiveXObject("Microsoft.XMLHTTP");

	if (req)
	{
		// Setup the callback
		if (callback)
		{
			req.onreadystatechange = function()
			{
				if (req.readyState == 4 && req.status == 200)
					callback(req.responseText);
			}
		}

		// Kick-off a request with async if a callback is provided
		req.open("GET", filename, callback ? true : false);
		req.send();
	}
}
