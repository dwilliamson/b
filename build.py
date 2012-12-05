
import gzip


js_min_file = "Code/Min/TinyBlog.js"

js_files = [
	"Code/Utils.js",
	"Code/ParserState_Code.js",
	"Code/ParserState_Disqus.js",
	"Code/ParserState_Equation.js",
	"Code/ParserState_Wiki.js",
	"Code/Parser.js",
	"Code/BlogEngine.js",
]

js_extern_files = [
	"Code/Extern/dygraph-combined.js",
	"Code/Extern/zepto.min.js",
]


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
		with gzip.open(dest_filename, "wb") as outf:
			outf.writelines(inf)


print("-"*60)
BuildTinyBlogMin()
print()
CompressJavascriptFile(js_min_file)
for js_file in js_extern_files:
	CompressJavascriptFile(js_file)
print("-"*60)
