<?php
header('Content-Type: text/xml');
require("Code/Utils.php");
$text = ReadTextFile("rss.xml");
echo $text;
?>
