
<?php

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

?>
