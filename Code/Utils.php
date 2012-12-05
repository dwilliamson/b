
<?php


function GetFilesInDirectory($dir)
{
	$files = array();

	// Enumerate each file and add to the array
	if ($handle = opendir($dir))
	{
		while (false != ($file = readdir($handle)))
		{
			if ($file != "." && $file != "..")
				$files[] = $file;
		}
	}

	return $files;
}


function EmitFilesInDirectory($dir)
{
	// Enumerate each file
	if ($handle = opendir($dir))
	{
		while (false !== ($file = readdir($handle)))
		{
			if ($file != "." && $file != ".." && $file != "rss.txt")
				echo "\t\t\t\t\"$dir/$file\",\n";
		}
	}
}


function GenerateBlogPostArray($array_name)
{
	// Create a javascript block declaring the array
	echo "<script language=\"javascript\">";
	echo "\n\t\t\tvar $array_name = [\n";

	// Look in all content directories
	EmitFilesInDirectory("Posts");
	EmitFilesInDirectory("Static");

	// Close the array and script block
	echo "\t\t\t];\n";
	echo "\t\t</script>\n";
}


function GetRSSPosts($filename)
{
	$file = fopen($filename, "r");
	if (!$file)
		return 0;

	$size = filesize($filename);
	if (!$size)
		return 0;

	// Read the file and split it into lines
	$data = fread($file, filesize($filename));
	$lines = explode("\n", $data);
	fclose($file);

	// Populate the post array using the date as the key
	$rss_posts = array();
	foreach ($lines as $line)
	{
		$bits = explode("|", $line);
		$rss_posts[$bits[0]] = $bits[1];
	}

	return $rss_posts;
}


function ReadTextFile($filename)
{
	// Open the file
	if (!file_exists($filename))
		return "";
	$file = fopen($filename, "r");
	if (!$file)
		return "";
	$size = filesize($filename);
	if (!$size)
		return "";

	// Read all its data
	$data = fread($file, filesize($filename));
	fclose($file);

	return $data;
}


function WriteTextFile($filename, $data)
{
	$file = fopen($filename, "w");
	if ($file)
	{
		fwrite($file, $data);
		fclose($file);
	}
}


function CalculatePostDigest()
{
	// Get the list of files and their modification times
	$files = GetFilesInDirectory("Posts");
	foreach ($files as $file)
		$files[] = filemtime("Posts/" . $file);

	// Stick a version number in for dev
	$files[] = 5;

	// Get its md5
	return md5(serialize($files));
}


function WriteRSSFeed($filename, $title, $description, $url, $timezone)
{
	$files = GetFilesInDirectory("Posts");

	// Generate the header
	$feed = "<rss version=\"2.0\">\n";	
	$feed .= "<channel>\n";
	$feed .= "<title>$title</title>\n";
	$feed .= "<link>$url</link>\n";
	$feed .= "<description>$description</description>\n";
	$feed .= "<language>en-uk</language>\n";

	foreach ($files as $file)
	{
		$post_text = ReadTextFile("Posts/" . $file);
		$description = substr($post_text, 0, 256) . "...";
		echo "$description<br>";

		// Construct the URL for this post
		$date = substr($file, 0, -4);
		$link = $url . "?d=" . $date;

		// Make sure the date string is in a format PHP understands
		$php_date = $date;
		$php_date[10] = " ";
		$php_date[13] = ":";
		$php_date[16] = ":";

		// Convert to RSS format
		$php_date = new DateTime($php_date, new DateTimeZone("BST"));
		$php_date = $php_date->format(DateTime::RSS);

		$feed .= "<item>\n";
		$feed .= "<title>$title</title>\n";
		$feed .= "<link>$link</link>\n";
		$feed .= "<guid>$link</guid>\n";
		$feed .= "<pubDate>$php_date</pubDate>\n";
		$feed .= "<description>$description</description>\n";

		$feed .= "</item>\n";
	}

	$feed .= "</channel>\n";
	$feed .= "</rss>\n";

	WriteTextFile($filename, $feed);
}


function GenerateRSSFeed($title, $description, $url, $timezone)
{
	// Calculate new digest and load existing one
	$new_digest = CalculatePostDigest();
	$old_digest = ReadTextFile("digest.txt");

	if ($old_digest != $new_digest)
	{
		echo "Not equals<br>";
		WriteTextFile("digest.txt", $new_digest);
	}

	WriteRSSFeed("feed.txt", $title, $description, $url, $timezone);

	echo "$new_digest";

	return;
	$rss_posts = GetRSSPosts("Posts/rss.txt");

	// Generate the header
	echo "<rss version=\"2.0\">\n";
	echo "<channel>\n";
	echo "<title>$title</title>\n";
	echo "<link>$url</link>\n";
	echo "<description>$description</description>\n";
	echo "<language>en-uk</language>\n";
	
	foreach ($rss_posts as $date => $title)
	{
		// Construct the URL for this post
		$link = $url . "?d=" . $date;

		// Make sure the date string is in a format PHP understands
		$php_date = $date;
		$php_date[10] = " ";
		$php_date[13] = ":";
		$php_date[16] = ":";

		// Convert to RSS format
		$php_date = new DateTime($php_date, new DateTimeZone("BST"));
		$php_date = $php_date->format(DateTime::RSS);

		echo "<item>\n";
		echo "<title>$title</title>\n";
		echo "<link>$link</link>\n";
		echo "<guid>$link</guid>\n";
		echo "<pubDate>$php_date</pubDate>\n";
		echo "<description>$title</description>\n";

		echo "</item>\n";
	}

	echo "</channel>\n";
	echo "</rss>\n";
}

?>
