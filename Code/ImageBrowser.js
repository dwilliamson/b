function ImageBrowserMouseDown(e)
{
	// Record a click on the gallery
	var images = e.currentTarget;
	images.MouseX = e.clientX;

	// Setup all elements for the move cursor
	images.style.cursor = "move";
	var children = images.getElementsByTagName("img");
	for (var i = 0; i < children.length; i++)
		children[i].style.cursor = "move";
}


function ImageBrowserMouseUp(images)
{
	// Signal mouse no longer held down
	images.MouseX = 0;
	images.MouseMoved = false;

	// Restore cursors for all elements
	images.style.cursor = "default";
	var children = images.getElementsByTagName("img");
	for (var i = 0; i < children.length; i++)
		children[i].style.cursor = "pointer";
}


function OnImageBrowserMouseDown(e)
{
	ImageBrowserMouseDown(e);
	return cancel_default_action(e);
}

function OnImageBrowserMouseMove(e)
{
	// Is the mouse held down?
	var images = e.currentTarget;
	if (images.MouseX)
	{
		// Calculate movement delta
		var dx = e.clientX - images.MouseX;
		images.MouseX = e.clientX;

		// Scroll
		images.scrollLeft -= dx;	
		images.MouseMoved = true;
	}

	return cancel_default_action(e);
}

function OnImageBrowserMouseUp(e)
{
	// Only go to the link if there was no mouse movement
	// TODO: Need to allow more link types
	var images = e.currentTarget;
	if (!images.MouseMoved && e.target)
	{
		var link = e.target.getAttribute("link");
		if (link)
			url_push_state(null, "/b/?d=" + link);
	}

	ImageBrowserMouseUp(images);
	return cancel_default_action(e);
}

function OnImageBrowserMouseOut(e)
{
	// mouseout gets generated for internal elements
	// Ensure the opposing element doesn't belong to the gallery, detecting moving out of it
	var images = e.currentTarget;
	if (e.relatedTarget == null || (e.relatedTarget != images && e.relatedTarget.parentNode != images))
	{
		ImageBrowserMouseUp(images);
		return cancel_default_action(e);
	}
}
