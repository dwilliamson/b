function set(){var result = { };for (i = 0; i < arguments.length; i++){result[arguments[i]] = 1;}return result;}function get_url_parameters(){var url = location.href.split('#')[0]var url_params = url.slice(url.indexOf('?') + 1).split('&');var params = { }for (i in url_params){var data = url_params[i].split('=');if (data[1] != "")params[data[0]] = data[1];}return params;}function build_archive_page(blog_posts){var month_strings = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];var archive_months = { };for (i in blog_posts){var document_id = blog_posts[i];document_id = document_id.replace("Static/", "");document_id = document_id.replace("Posts/", "");var bits = document_id.split("-");if (bits.length < 2)continue;var name = month_strings[parseInt(bits[1], 10) - 1] + ", " + bits[0]if (!(name in archive_months))archive_months[name] = [ 1, document_id.substr(0, 7) ];elsearchive_months[name][0]++;}var archives_page = "[lit]<div style='font-size:8pt; line-height:1.3em;'>[/lit]**Archives**\n"for (name in archive_months){count = archive_months[name][0];link = archive_months[name][1];archives_page += "{" + name + " (" + count + ")|" + link + "}\n";}archives_page += " [lit]</div>[/lit]"return new Parser(archives_page, null, "");}function bind(){if (arguments.length == 0)return null;var scope = window;var func = arguments[0];var start = 1;if (typeof(arguments[0]) != "string"){scope = arguments[0];func = arguments[1];start = 2;}var arg_array = Array.prototype.slice.call(arguments, start);func = scope[func];start = arg_array.length;return function(){for (var i = 0; i < arguments.length; i++)arg_array[start + i] = arguments[i];return func.apply(scope, arg_array);}}function Selector(name_or_node){this.Node = name_or_node;if (typeof(name_or_node) == "string"){if (name_or_node[0] == "#")this.Node = document.getElementById(name_or_node.substr(1));elsethis.Node = document.getElementsByTagName(name_or_node)[0];}this.empty = function(){while (this.Node.firstChild)this.Node.removeChild(this.Node.firstChild);return this;}this.append = function(html){var div = document.createElement("div");div.innerHTML = html;this.Node.appendChild(div);return this;}this.set_html = function(html){this.Node.innerHTML = html;return this;}this.set_attr = function(attr, value){this.Node.setAttribute(attr, value);}this.show = function(){this.Node.style.display = "inline";return this;}this.hide = function(){this.Node.style.display = "none";return this;}this.offset = function(){var x = 0, y = 0;for (var node = this.Node; node != null; node = node.offsetParent){x += node.offsetLeft;y += node.offsetTop;}return { top: y, left: x };}this.set_left = function(left){this.Node.style.left = left + "px";return this;}this.set_top = function(top){this.Node.style.top = top + "px";return this;}this.set_width = function(width){this.Node.style.width = width + "px";return this;}this.set_height = function(height){this.Node.style.height = height + "px";return this;}this.set_opacity = function(opacity){this.Node.style.opacity = opacity;return this;}this.click = function(fn){this.Node.onclick = fn;return this;}}function S(name){return new Selector(name);}S.__proto__.get = function(filename, callback){var req;if (window.XMLHttpRequest)req = new XMLHttpRequest();elsereq = new ActiveXObject("Microsoft.XMLHTTP");if (req){req.onreadystatechange = function(){if (req.readyState == 4 && req.status == 200)callback(req.responseText);}req.open("GET", filename, true);req.send();}}var blahblah;(function(){var DomReady = window.DomReady = {};var userAgent = navigator.userAgent.toLowerCase();var browser = {version: (userAgent.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [])[1],safari: /webkit/.test(userAgent),opera: /opera/.test(userAgent),msie: (/msie/.test(userAgent)) && (!/opera/.test( userAgent )),mozilla: (/mozilla/.test(userAgent)) && (!/(compatible|webkit)/.test(userAgent))};    var readyBound = false;	var isReady = false;var readyList = [];function domReady() {if(!isReady) {isReady = true;if(readyList) {for(var fn = 0; fn < readyList.length; fn++) {readyList[fn].call(window, []);}readyList = [];}}};function addLoadEvent(func) {var oldonload = window.onload;if (typeof window.onload != 'function') {window.onload = func;} else {window.onload = function() {if (oldonload) {oldonload();}func();}}};function bindReady() {if(readyBound) {return;}readyBound = true;if (document.addEventListener && !browser.opera) {document.addEventListener("DOMContentLoaded", domReady, false);}if (browser.msie && window == top) (function(){if (isReady) return;try {document.documentElement.doScroll("left");} catch(error) {setTimeout(arguments.callee, 0);return;}domReady();})();if(browser.opera) {document.addEventListener( "DOMContentLoaded", function () {if (isReady) return;for (var i = 0; i < document.styleSheets.length; i++)if (document.styleSheets[i].disabled) {setTimeout( arguments.callee, 0 );return;}domReady();}, false);}if(browser.safari) {var numStyles;(function(){if (isReady) return;if (document.readyState != "loaded" && document.readyState != "complete") {setTimeout( arguments.callee, 0 );return;}if (numStyles === undefined) {var links = document.getElementsByTagName("link");for (var i=0; i < links.length; i++) {if(links[i].getAttribute('rel') == 'stylesheet') {numStyles++;}}var styles = document.getElementsByTagName("style");numStyles += styles.length;}if (document.styleSheets.length != numStyles) {setTimeout( arguments.callee, 0 );return;}domReady();})();}addLoadEvent(domReady);};DomReady.ready = function(fn, args) {bindReady();if (isReady) {fn.call(window, []);} else {readyList.push( function() { return fn.call(window, []); } );}};bindReady();})();function ParserState_Code(parser){this.parser = parser;this.name = "Code";cpp_tokens = set("#define","#undef","#if","#ifdef","#ifndef","#elif","#endif","#include","#pragma","void","bool","char","short","long","int","float","double","unsigned","signed","do","while","return","if","else","switch","case","default","for","break","continue","goto","static","extern","inline","const","mutable","volatile","template","typename","typedef","typeid","namespace","using","class","struct","friend","union","enum","public","private","protected","try","catch","throw","const_cast","static_cast","dynamic_cast","reinterpret_cast","new","delete","sizeof","true","false","this","explicit","virtual","operator","Dim","End","While","If","Try","Catch","As","Is","And");comment_open_pattern = /^\/\//;vb_comment_open_pattern = /^'/;comment_pattern = /^[^\n]*/;string_open_pattern = /^\"/;string_pattern = /^[^\"]*/;id_pattern = /^[#A-Za-z_][A-Za-z_]*/;this.on_enter = function(){if (this.parser.view_codewp)this.parser.add_html('<pre lang="cpp" escaped="true">');elsethis.parser.add_html('<div class="code">');};this.on_exit = function()	{if (this.parser.view_codewp)this.parser.add_html('</pre>');elsethis.parser.add_html('</div>');this.parser.consume_newline();};append_span = function(cls, text){this.parser.add_html('<span class="' + cls + '">');    this.parser.append(text);this.parser.add_html('</span>');};this.parse = function(){if (this.parser.view_codewp){c = this.parser.get();switch (c){case ("<"): this.parser.append("&amp;lt;"); break;case (">"): this.parser.append("&amp;gt;"); break;default: this.parser.append(c);}return;}if (this.parser.match(comment_open_pattern, "/")){comment = this.parser.match(comment_pattern);this.parser.pos++;append_span("comment", "//" + comment[0]);this.parser.add_html("<br>");}else if (this.parser.match(vb_comment_open_pattern, "'")){comment = this.parser.match(comment_pattern);this.parser.pos++;append_span("comment", "'" + comment[0]);this.parser.add_html("<br>");}else if (this.parser.match(string_open_pattern, "\"")){text = this.parser.match(string_pattern);this.parser.pos++;append_span("string", '"' + text + '"');}else if (token = this.parser.match(id_pattern)){if (token[0] in cpp_tokens)append_span("keyword", token[0]);elsethis.parser.append(token[0]);}c = this.parser.get();this.parser.append(c);};}function ParserState_Disqus(parser){this.parser = parser;this.name = "Disqus";this.on_enter = function(){var params = get_url_parameters();if ("d" in params && params["d"] == this.parser.document_id){this.parser.add_html('<br/><br/><br/><div id="disqus_thread">');(function() {var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);})();}else{this.parser.add_html('<a href="' + this.parser.document_url + '#disqus_thread" data-disqus-identifier="' + this.parser.document_id + '"></a>');(function () {var s = document.createElement('script'); s.async = true;s.type = 'text/javascript';s.src = 'http://' + disqus_shortname + '.disqus.com/count.js';(document.getElementsByTagName('HEAD')[0] || document.getElementsByTagName('BODY')[0]).appendChild(s);}());}};this.on_exit = function()	{this.parser.add_html('</div>');};this.parse = function(){};}function ParserState_Equation(parser){this.parser = parser;this.name = "Equation";this.markup_tags =[[ /^_/, "sub", "/sub", false, "_" ],[ /^\^u/, "sup", "/sup", false, "^" ],[ /^\|\|/, "table style='margin-top:0.5em; margin-bottom:0.5em; text-align:center;' cellpadding='0' cellspacing='0'", "/table", false, "|" ],[ /^--/, "tr", "/tr", false, "-" ],[ /^\\\\/, "td rowspan='2'", "/td", false, "\\" ],[ /^\\_/, "td style='border-top:solid 1px black;'", "/td", false, "\\" ],[ /^\\/, "td", "/td", false, "\\" ]];this.replacement_tags =[[ /^\*/, "<span class='equation_sym'>&nbsp;&#183;</span>", "*" ],[ /^\^/, "&nbsp;&#215;", "^" ],[ /^theta/, "&#952;", "t" ],[ /^sum/, "&sum;", "s" ],[ /^SUM/, "<span class='equation_large'>&sum;</span>", "S" ],];this.on_enter = function(){this.parser.add_html('<span class="equation">');};this.on_exit = function(){this.parser.add_html('</span>');};this.parse = function(){for (i in this.markup_tags){markup = this.markup_tags[i];if (this.parser.match(markup[0], markup[4])){if (markup[3])this.parser.add_html("<" + markup[2] + ">");elsethis.parser.add_html("<" + markup[1] + ">");markup[3] = !markup[3];return;}}for (i in this.replacement_tags){replacement = this.replacement_tags[i];if (this.parser.match(replacement[0], replacement[2])){this.parser.add_html(replacement[1]);return;}}c = this.parser.get();this.parser.append(c);};}function ParserState_Wiki(parser){this.parser = parser;this.name = "Wiki";this.table = false;this.markup_tags =[[ /^\*\*/, "b", false, "*" ],[ /^__/, "u", false, "_" ],[ /^--/, "i", false, "-" ],[ /^\^u/, "sup", false, "^" ],[ /^\^d/, "sub", false, "^" ],[ /^\|\|/, "center", false, "|", true ],[ /^=====/, "h1", false, "=", true],[ /^====/, "h2", false, "=", true ],[ /^===/, "h3", false, "=", true ],[ /^==/, "h4", false, "=", true ]];url_pattern = /^{[^\|]*\|[^}]*}/;img_pattern = /^{{[^}]*}}/;title_pattern = /^\<<[^>]*>>/;table_open_pattern = /^\n\s*\*/;table_item_pattern = /^\n\s*\*/;table_close_pattern = /^\n/;this.on_enter = function(){};this.on_exit = function(){};this.parse = function(){for (i in this.markup_tags){markup = this.markup_tags[i];if (this.parser.match(markup[0], markup[3])){if (markup[2]){this.parser.add_html("</" + markup[1] + ">");if (markup[4])this.parser.consume_newline();}elsethis.parser.add_html("<" + markup[1] + ">");markup[2] = !markup[2];return;}}if (url = this.parser.match(img_pattern, "{")){images = url[0].slice(2, -2).split("|");if (images[1].indexOf("url:") == 0)this.parser.add_html('<a href="' + images[1].replace("url:", "") + '" target="new"><img src="' + images[0] + '"></a>');elsethis.parser.add_html('<a href="' + images[1] + '" class="image"><img src="' + images[0] + '"></a>');return;}else if (url = this.parser.match(url_pattern, "{")){url = url[0].slice(1, -1).split("|");if (url[1].indexOf("http") == 0)this.parser.add_html('<a href="' + url[1] + '" target="new">' + url[0] + '</a>');else{html = '<a href="javascript:blog_goto(' + "'" + url[1] + "')" + '">' + url[0] + '</a>';this.parser.add_html(html);}}else if (title = this.parser.match(title_pattern, "<")){title = title[0].slice(2, -2);html = '<a href="javascript:blog_goto(' + "'" + this.parser.document_id + "')" + '" class="title">' + title + '</a><br/>';this.parser.add_html(html);if (this.parser.date != null)this.parser.add_html('<span class="date">Posted ' + this.parser.date.toLocaleString() + '</span>');}else if (!this.table && this.parser.match(table_open_pattern, "\n")){this.parser.add_html("<ul><li>");this.table = true;}else if (this.table){if (this.parser.match(table_item_pattern, "\n")){this.parser.add_html("</li><li>");}else if (this.parser.match(table_close_pattern, "\n")){this.parser.add_html("</li></ul>");this.table = false;this.parser.consume_newline();return;}}c = this.parser.get();this.parser.append(c);};}function ParserState_Literal(parser){this.parser = parser;this.on_enter = function() { }this.on_exit = function() { }this.parse = function(){c = this.parser.get();this.parser.html += c;}}function Parser(data, date, document_url, document_id, params){this.date = date;this.document_url = document_url;this.document_id = document_id;this.state_map = { };this.state_stack = [ ];this.script = data;this.html = "";this.pos = 0;this.view_html = params && "viewhtml" in params;this.view_codewp = params && "viewcodewp" in params;this.get = function(){return this.script[this.pos++];};this.match = function(pattern, fc){if (fc && this.script[this.pos] != fc){return null;}cursor = this.script.substr(this.pos);match = pattern.exec(cursor);if (match != null){this.pos += match[0].length;return match;}return null;};this.consume_newline = function(){if (this.script[this.pos] == "\n")this.pos++;else if (this.script[this.pos] == '\r' && this.script[this.pos + 1] == "\n")this.pos += 2;}this.add_html = function(text){if (this.view_html)this.append(text);elsethis.html += text;}this.append = function(text){for (i in text){switch (text[i]){case ("<"): this.html += "&lt;"; break;case (">"): this.html += "&gt;"; break;case ("\n"): this.html += "<br>"; break;case ("\r"): break;case ("\t"): this.html += "&nbsp;&nbsp;&nbsp;&nbsp;"; break;default: this.html += text[i];}}};this.parse_tag = function(){tag = this.match(/^\[\/?[A-Za-z]*\]/, "["); if (tag == null){return;}tag = tag[0].slice(1, -1);exit = tag[0] == "/";tag = tag.substr(exit);if (tag in this.state_map)this.switch_state(this.state_map[tag], exit);};this.switch_state = function(state, exit){if (exit){this.current_state.on_exit();this.state_stack.pop();this.current_state = this.state_stack[this.state_stack.length - 1];}else{st = new state(this);this.state_stack.push(st);this.current_state = st;this.current_state.on_enter();}};this.parse = function(){if (this.view_html)this.html += '<div class="viewhtml">';while (this.pos < this.script.length){this.parse_tag();this.current_state.parse();}if (this.view_html)this.html += '</div>';return this.html;}this.switch_state(ParserState_Wiki, false);this.state_map["code"] = ParserState_Code;this.state_map["lit"] = ParserState_Literal;this.state_map["disqus"] = ParserState_Disqus;this.state_map["eq"] = ParserState_Equation;}function BlogEngine(){show_image = function(element){var window_w = window.innerWidth;var window_h = window.innerHeight;S("#image_background").set_width(window_w).set_height(window_h).click(hide_image).show();img = new Image();img.src = element.href;img.onload = function(){S("#image_display").set_attr("src", this.src);var img_dest_w = window_w * 0.6;var img_dest_h = img.height * (img_dest_w / img.width)if (img.height > img.width){img_dest_h = window_h * 0.6;img_dest_w = img.width * (img_dest_h / img.height)}var img_dest_t = window_h / 2 - img_dest_h / 2;var img_dest_l = window_w / 2 - img_dest_w / 2;S("#image_display").set_top(img_dest_t).set_left(img_dest_l).set_width(img_dest_w).set_height(img_dest_h).click(hide_image).show();S("#image_foreground").set_top(img_dest_t - 5).set_left(img_dest_l - 5).set_width(img_dest_w + 10).set_height(img_dest_h + 10).click(hide_image).show();}}hide_image = function(){S("#image_background").hide();S("#image_foreground").hide();S("#image_display").hide();}DomReady.ready(function(){S("body").append('<div id="image_background"></div>')S("body").append('<div id="image_foreground"></div>');S("body").append('<img id="image_display">');});DisplayPost = function(params, filename, document_id, post_div, load_all, chain, chain_index){var window_h = window.innerHeight;var window_t = window.pageYOffset;var div_offset = post_div.offset();if (load_all == false && div_offset.top > window_t + window_h){if (chain_index < chain.length)window.onscroll = bind("DisplayPost", params, filename, document_id, post_div, load_all, chain, chain_index);elsewindow.onscroll = null;return;}S.get(filename, function(data){var date = null;var c = document_id.split('-');if (c.length == 6)date = new Date(c[0], c[1] - 1, c[2], c[3], c[4], c[5], 0);var document_url = location.pathname + "?d=" + document_id;parser = new Parser(data, date, document_url, document_id, params);parser.parse();post_div.set_html(parser.html);if (post_callback)post_callback(post_div)var images = post_div.Node.getElementsByClassName("image");for (i in images){S(images[i]).click(function(event){show_image(event.currentTarget);event.preventDefault();});}if (chain_index < chain.length){var c = chain[chain_index];c(chain, chain_index + 1);}},"html");}	this.DisplayPosts = function(div_id, blog_posts, params, post_callback, load_all){DomReady.ready(function(){var display_post_calls = [ ];for (i in blog_posts){if (typeof blog_posts[i] != "string"){var html = blog_posts[i].parse();S(div_id).append('<div class="post" id="generated">' + html + '</div>');if (post_callback)post_callback(S("#generated"));continue;}var document_id = blog_posts[i].replace(".txt", "");if (params && !("d" in params) && document_id.indexOf("Posts/") != 0)continue;document_id = document_id.replace("Posts/", "");document_id = document_id.replace("Static/", "");if (params && "d" in params && document_id.indexOf(params["d"]) != 0)continue;					var post_div_id = "Post" + document_id.replace(/\-/g, "");S(div_id).append('<div class="post" id="' + post_div_id + '"></div>');var post_div = S("#" + post_div_id);display_post_calls.push(bind("DisplayPost", params, blog_posts[i], document_id, post_div, load_all));}if (display_post_calls.length){var c = display_post_calls[0];c(display_post_calls, 1);}});}}