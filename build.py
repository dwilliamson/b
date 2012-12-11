
import gzip
import os
import string
from datetime import timedelta, datetime, tzinfo


js_min_file = "Code/Min/TinyBlog.js"

js_files = [
	"Code/Utils.js",
	"Code/DOMReady.js",
	"Code/ParserState_Code.js",
	"Code/ParserState_Disqus.js",
	"Code/ParserState_Equation.js",
	"Code/ParserState_Wiki.js",
	"Code/Parser.js",
	"Code/BlogEngine.js",
]

js_extern_files = [
	"Code/Extern/dygraph-combined.js",
]

rss_title = "Gazoo.cpp"
rss_description = "An independent developer in the wild"
rss_url = "http://donw.org/b/"
rss_posts = "Posts"
rss_output = "rss.xml"


def BuildTinyBlogMin():

	with open(js_min_file, "wb") as outf:

		for js_file in js_files:

			# Read all lines of the input javascript file
			print("Reading JavaScript source: " + js_file)
			f = open(js_file, "rb")
			js_lines = f.readlines()
			f.close()

			# Convert all lines to UTF-8 to make parsing easier
			js_lines = [ line.decode("utf-8") for line in js_lines ]

			# Ensure the last line ends with a newline
			last_line = js_lines[-1]
			last_char = last_line[-1]
			if last_char != "\n":
				js_lines[-1] += "\r\n"

			# Remove comments only at the beginning of lines as it's too much work
			# to parse JS regexp and comments in strings
			for i, line in enumerate(js_lines):
				line = line.lstrip()
				if line[:2] == "//":
					js_lines[i] = ""

			# Remove whitespace from the beginning of lines and strip the "\n" character
			js_lines = [ line.lstrip()[:-1] for line in js_lines ]

			# Convert back to bytes and concatenate in the output file
			js_lines = [ bytes(line, "utf-8") for line in js_lines ]
			outf.writelines(js_lines)


def CompressJavascriptFile(src_filename):

	# Construct output filename
	if not src_filename.endswith(".js"):
		print("ERROR: Can't compress file with name: " + src_filename)
		return
	dest_filename = src_filename[:-2] + "jgz"
	print("Compressing '" + src_filename + "' to '" + dest_filename + "'")

	# Compress
	with open(src_filename, "rb") as inf:
		with gzip.GzipFile(dest_filename, "wb", 9, mtime = 0) as outf:
			outf.writelines(inf)


class GMT0(tzinfo):
	def __init__(self, year):         # DST starts last Sunday in March
		d = datetime(year, 4, 1)   # ends last Sunday in October
		self.dston = d - timedelta(days=d.weekday() + 1)
		d = datetime(year, 11, 1)
		self.dstoff = d - timedelta(days=d.weekday() + 1)
	def utcoffset(self, dt):
		return timedelta(hours=0) + self.dst(dt)
	def dst(self, dt):
		if self.dston <= dt.replace(tzinfo=None) < self.dstoff:
			return timedelta(hours=1)
		else:
			return timedelta(0)
	def tzname(self,dt):
		return "GMT +1"


def BuildRSS(title, description, url, posts_directory, output):

	print("\nGenerating RSS file " + output)
	outf = open(output, "w")

	# Generate the header
	print('<rss version="2.0">', file=outf)
	print('<channel>', file=outf)
	print('<title>' + title + '</title>', file=outf)
	print('<link>' + url + '</link>', file=outf)
	print('<description>' + description + '</description>', file=outf)
	print('<language>en-uk</language>', file=outf)

	# Walk every text file in the posts directory
	for root, dirs, files in os.walk(posts_directory):
		for filename in files:
			if filename.endswith(".txt"):

				# Unpack the date from the filename
				year = int(filename[0:4])
				month = int(filename[5:7])
				day = int(filename[8:10])
				hour = int(filename[11:13])
				minute = int(filename[14:16])
				second = int(filename[17:19])

				# Generate the date string (GMT+0 fixed)
				d = datetime(year, month, day, hour, minute, second, 0, GMT0(year))
				dstr = d.strftime("%a, %d %b %Y %H:%M:%S %z")

				# Read a limited subset of the post
				f = open(os.path.join(root, filename), "rb")
				content = str(f.read(256), "ascii")
				f.close()

				# Pull out the title and escape it
				start = content.index("<<") + 2
				end = content.index(">>")
				title = content[start:end]
				title = title.replace("&", "&amp;")

				# The rest is a small description of the post
				content = content[end + 2:].lstrip()

				link = url + "?d=" + filename[:-4]

				# Generate the RSS for this post
				print("<item>", file=outf)
				print("<title>" + title + "</title>", file=outf)
				print("<link>" + link + "</link>", file=outf)
				print("<guid>" + link + "</guid>", file=outf)
				print("<pubDate>" + dstr + "</pubDate>", file=outf)
				print("<description>" + content + "</description>", file=outf)
				print("</item>", file=outf)

	print("</channel>", file=outf)
	print("</rss>", file=outf)

	outf.close()
				



print("-"*60)
BuildTinyBlogMin()
print()
CompressJavascriptFile(js_min_file)
for js_file in js_extern_files:
	CompressJavascriptFile(js_file)
BuildRSS(rss_title, rss_description, rss_url, rss_posts, rss_output)
print("-"*60)
