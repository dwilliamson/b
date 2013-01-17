


// ====================================================================================== //
//    JAVASCRIPT UTILITIES
// ====================================================================================== //



// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
	return window.requestAnimationFrame    || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame    || 
		window.oRequestAnimationFrame      || 
		window.msRequestAnimationFrame     || 
		function( callback ){
			window.setTimeout(callback, 1000 / 60);
		};
})();


function ClearError(error)
{
	var status = document.getElementById("Status");
	status.innerHTML = "Status: OK";
	status.style.backgroundColor = "CCC";
}


function FatalError(error)
{
	var status = document.getElementById("Status");
	status.innerHTML = error;
	status.style.backgroundColor = "FAA";
}


function EndsWith(str, suffix)
{
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}


function GetDocument(filename, callback)
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

		// Return the result when blocking
		if (!callback && req.status == 200)
			return req.responseText;
	}

	return null;
}


function HashString(str)
{
	var hash = 5381;
	for (var i = 0; i < str.length; i++)
	{
		var c = str.charCodeAt(i);
		hash = c + (hash << 6) + (hash << 16) - hash;
	}
	return hash;
}



// ====================================================================================== //
//    GEOMETRY UTILITIES
// ====================================================================================== //



function CreatePlaneGeometry(scale, nb_vertices_x)
{
	var positions = new Array();

	// Generate a linear array of vertices
	var mid = scale / 2.0;
	scale *= (1.0 / (nb_vertices_x - 1.0));
	for (var y = 0, i = 0; y < nb_vertices_x; y++)
	{
		for (var x = 0; x < nb_vertices_x; x++, i++)
		{
			// Calculate position
			var p = vec3.create();
			p[0] = x * scale - mid;
			p[1] = 1;
			p[2] = y * scale - mid;
			positions.push(p);
		}
	}

	var indices = new Array();

	// Triangle strip the plane
	for (var y = 0; y < nb_vertices_x - 1; y++)
	{
		// Strip-join double-tap
		var index = y * nb_vertices_x;
		indices.push(index);

		// Strip this row
		for (var x = 0; x < nb_vertices_x; x++)
		{
			indices.push(index);
			indices.push(index + nb_vertices_x);
			index++;
		}

		// Strip-join double-tap
		indices.push((index - 1) + nb_vertices_x);
	}

	return [ positions, indices ]
}


function CreateCubeGeometry(scale_x, nb_vertices_x)
{
	var vertices = new Array();
	var indices = new Array();

	// Iterate over every face on the box
	for (var i = 0; i < 6; i++)
	{
		var axis = Math.floor(i / 2);
		var angle = (i & 1) ? Math.PI / 2 : -Math.PI / 2;
		var side = (i & 1) ? 1.0 : -1.0;

		var scale = vec3.create();
		var rotation = mat4.create();
		var position = vec3.create();

		// Determine the scale, rotation and position for the plane vertices
		vec3.set(scale, scale_x, 1, scale_x);
		switch (axis)
		{
			case 0:
				mat4.rotateZ(rotation, rotation, angle);
				vec3.set(position, scale_x * side, 0, 0);
				break;
			case 1:
				mat4.rotateX(rotation, rotation, angle + Math.PI / 2);
				vec3.set(position, 0, scale_x * side, 0);
				break;
			case 2:
				mat4.rotateX(rotation, rotation, angle);
				vec3.set(position, 0, 0, scale_x * side);
				break;
		}

		// Generate a plane for each face and transform its vertices to fit the face
		var plane_data = CreatePlaneGeometry(1, nb_vertices_x);
		var plane_vertices = plane_data[0];
		for (var j = 0; j < plane_vertices.length; j++)
		{
			var v = plane_vertices[j];
			vec3.mul(v, v, scale);
			vec3.transformMat4(v, v, rotation);
		}

		// Merge
		// Indices have already been double-tapped for join
		var plane_indices = plane_data[1];
		for (var j = 0; j < plane_indices.length; j++)
			indices.push(plane_indices[j] + vertices.length);
		vertices = vertices.concat(plane_vertices);
	}

	return [ vertices, indices ];
}


function CreateWireframeIndices(indices)
{
	var wireframe_indices = new Array();

	for (var i = 0; i < indices.length - 2; i++)
	{
		// Strip unpack
		var i0 = indices[i];
		var i1 = indices[i + 1];
		var i2 = indices[i + 2];

		// Ignore degenerate strip joins
		if (i0 == i1 || i0 == i2 || i1 == i2)
			continue;

		// Pack as a line list
		wireframe_indices.push(i0);
		wireframe_indices.push(i1);
		wireframe_indices.push(i1);
		wireframe_indices.push(i2);
		wireframe_indices.push(i2);
		wireframe_indices.push(i0);
	}

	// Assuming the a triangulated list of quads, pull out the quad diagonals
	var filtered_indices = new Array();
	function Add(base)
	{
		for (var i = 1; i < arguments.length; i++)
			filtered_indices.push(wireframe_indices[base + arguments[i]]);
	}
	for (var i = 0; i < wireframe_indices.length; i += 12)
		Add(i, 0, 1, 4, 5, 8, 9, 10, 11);

	return filtered_indices;
}



// ====================================================================================== //
//    WEBGL UTILITIES
// ====================================================================================== //



function LoadShader(gl, filename)
{
	// Block loading the shader
	var source = GetDocument(filename, null);
	if (!source)
	{
		FatalError("Failed to load shader: " + filename);
		return null;
	}

	// Decide the shader type from the filename extension
	var type = gl.FRAGMENT_SHADER;
	if (EndsWith(filename.toLowerCase(), ".vsh"))
		type = gl.VERTEX_SHADER;

	// Create and compile the shader
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	// Report any compilation errors
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	{
		FatalError(filename + "\n" + gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}


function CreateVertexBuffer(gl, vertices)
{
	// Create the vertex buffer
	var vbuffer = gl.createBuffer();
	if (!vbuffer)
	{
		FatalError("Failed to create vertex buffer");
		return null;
	}

	// Concatenate into a float32 array
	var all_vertices = new Float32Array(vertices.length * 3);
	for (var i = 0; i < vertices.length; i++)
		all_vertices.set(vertices[i], i * 3);

	// Set the vertex buffer data
	gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
	gl.bufferData(gl.ARRAY_BUFFER, all_vertices, gl.STATIC_DRAW);
	vbuffer.nb_vertices = vertices.length;

	return vbuffer;
}


function CreateIndexBuffer(gl, indices)
{
	// Create the index buffer
	var ibuffer = gl.createBuffer();
	if (!ibuffer)
	{
		FatalError("Failed to create index buffer");
		return null;
	}

	// Set the index buffer data
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	ibuffer.nb_indices = indices.length;

	return ibuffer;
}


function GetShaderUniform(gl, program, uniform_name)
{
	var uniform = gl.getUniformLocation(program, uniform_name);
	if (!uniform)
	{
		FatalError("Couldn't locate uniform: " + uniform_name);
		return null;
	}

	return uniform;
}


function SetShaderUniformFloat(gl, program, uniform_name, value)
{
	var uniform = GetShaderUniform(gl, program, uniform_name);
	if (uniform)
		gl.uniform1f(uniform, value);
}


function SetShaderUniformVector3(gl, program, uniform_name, vector)
{
	var uniform = GetShaderUniform(gl, program, uniform_name);
	if (uniform)
		gl.uniform3fv(uniform, vector);
}


function SetShaderUniformMatrix4(gl, program, uniform_name, matrix)
{
	var uniform = GetShaderUniform(gl, program, uniform_name);
	if (uniform)
		gl.uniformMatrix4fv(uniform, false, matrix);
}


function InitWebGL(canvas)
{
	// Get WebGL context
	var gl = null;
	try
	{
		gl = canvas.getContext("webgl", { antialias: true }) || canvas.getContext("experimental-webgl", { antialias: true });
	}
	catch (e)
	{
	}

	// Blitz page on error
	if (!gl)
		FatalError("Couldn't initialise WebGL");

	return gl;
}



// ====================================================================================== //
//    INPUT UTILITIES
// ====================================================================================== //



var g_KeyState = [ ];

var Keys = {

	// ASCII Keys
	W: 87,
	S: 83,
	A: 65,
	D: 68,

	SPACE:32,
	SHIFT:16,

	// Hijack with mouse keys
	MB:0,
};

var g_MouseDelta = [ 0, 0 ];
var g_LastMouseDragPos = null;


function InitInput(canvas)
{
	// Can't attach key events to a canvas
	// Need to avoid processing movement for elements other than the canvas
	// So check for keypresses in the body instead
	document.onkeydown = function(ev)
	{
		if (ev.target == document.body)
			g_KeyState[ev.keyCode] = true;
	}
	document.onkeyup = function(ev)
	{
		if (ev.target == document.body)
			g_KeyState[ev.keyCode] = false;
	}

	// Handle mouse presses
	canvas.onmousedown = function(ev)
	{
		g_KeyState[Keys.MB] = true;
		g_LastMouseDragPos = [ ev.clientX, ev.clientY ];
	}
	canvas.onmouseup = function(ev)
	{
		g_KeyState[Keys.MB] = false;
		g_LastMouseDragPos = null;
	}
	canvas.onmouseout = function(ev)
	{
		g_KeyState[Keys.MB] = false;
		g_LastMouseDragPos = null;
	}

	// Handle mouse move dragging
	canvas.onmousemove = function(ev)
	{
		if (g_LastMouseDragPos)
		{
			g_MouseDelta[0] += ev.clientX - g_LastMouseDragPos[0];
			g_MouseDelta[1] += ev.clientY - g_LastMouseDragPos[1];
			g_LastMouseDragPos[0] = ev.clientX;
			g_LastMouseDragPos[1] = ev.clientY;
		}
	}
}



// ====================================================================================== //
//    MAIN PROGRAM
// ====================================================================================== //



// Create a vector colour enum
var Colours = {
	BLACK : [ 0, 0, 0 ],
	WHITE : [ 1, 1, 1 ],
};

// Replace RGB triplets with vectors
for (var i in Colours)
{
	var rgb = Colours[i];
	var vec = vec3.create();
	vec3.set(vec, rgb[0], rgb[1], rgb[2]);
	Colours[i] = vec;
}


function Mesh()
{
	this.Init = function(gl, vertices, indices)
	{
		// Create the data buffers
		this.VertexBuffer = CreateVertexBuffer(gl, vertices);
		this.IndexBuffer = CreateIndexBuffer(gl, indices);
		this.WireframeIndexBuffer = CreateIndexBuffer(gl, CreateWireframeIndices(indices));
	}
}


function Scene()
{
	// Create all resources
	this.glProjectionMatrix = mat4.create();
	this.CameraPosition = vec3.create();
	this.CameraRotation = vec3.create();
	this.CameraRotationMatrix = mat4.create();
	this.glInvViewMatrix = mat4.create();
	this.glViewMatrix = mat4.create();

	this.Meshes = [ ];

	this.Init = function(gl, program, canvas)
	{
		// Bind the scene to the context
		this.gl = gl;

		// Embed the program in the scene
		this.Program = program;

		// Get canvas dimensions
		this.CanvasWidth = canvas.width;
		this.CanvasHeight = canvas.height;
		this.AspectRatio = this.CanvasWidth / this.CanvasHeight;

		// Set a default perspective matrix
		mat4.perspective(this.glProjectionMatrix, 45, this.AspectRatio, 0.1, 100.0);

		// Set default camera orientation
		vec3.set(this.CameraPosition, 0, 0, 3);
		vec3.set(this.CameraRotation, 0, 0, 0);

		this.UpdateMatrices();
	}

	this.UpdateRotationMatrix = function()
	{
		mat4.identity(this.CameraRotationMatrix);
		mat4.rotateY(this.CameraRotationMatrix, this.CameraRotationMatrix, this.CameraRotation[1]);
		mat4.rotateX(this.CameraRotationMatrix, this.CameraRotationMatrix, this.CameraRotation[0]);
		return this.CameraRotationMatrix;
	}

	this.UpdateMatrices = function()
	{
		this.UpdateRotationMatrix();

		// Calculate view matrix from the camera
		mat4.identity(this.glInvViewMatrix);
		mat4.translate(this.glInvViewMatrix, this.glInvViewMatrix, this.CameraPosition);
		mat4.mul(this.glInvViewMatrix, this.glInvViewMatrix, this.CameraRotationMatrix);
		mat4.invert(this.glViewMatrix, this.glInvViewMatrix);
	}

	this.AddMesh = function(vertices, indices)
	{
		var mesh = new Mesh();
		mesh.Init(this.gl, vertices, indices);
		this.Meshes.push(mesh);
	}

	this.DrawMesh = function(gl, mesh, type, colour)
	{
		// Concatenate with identity to get model view for now
		var model_view = mat4.create();
		mat4.mul(model_view, model_view, this.glViewMatrix);

		// Apply program and set shader constants
		gl.useProgram(this.Program);
		SetShaderUniformMatrix4(gl, this.Program, "glProjectionMatrix", this.glProjectionMatrix);
		SetShaderUniformMatrix4(gl, this.Program, "glModelViewMatrix", model_view);
		SetShaderUniformVector3(gl, this.Program, "glColour", colour);

		// Setup the program attributes
		var a_vpos = gl.getAttribLocation(this.Program, "glVertex");
		gl.enableVertexAttribArray(a_vpos);
		gl.vertexAttribPointer(a_vpos, 3, gl.FLOAT, false, 0, 0);

		// Decide which index buffer to use
		var ibuffer = mesh.IndexBuffer;
		if (type == gl.LINES)
			ibuffer = mesh.WireframeIndexBuffer;

		// Draw the mesh	
		gl.bindBuffer(gl.ARRAY_BUFFER, mesh.VertexBuffer);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuffer);
		gl.drawElements(type, ibuffer.nb_indices, gl.UNSIGNED_SHORT, 0);
	}

	this.DrawMeshes = function(type, colour)
	{
		this.UpdateMatrices();

		for (i in this.Meshes)
		{
			var mesh = this.Meshes[i];
			this.DrawMesh(this.gl, mesh, type, colour);
		}
	}
}


function DrawScene(gl, scene)
{
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Update camera rotation and reset mouse delta
	scene.CameraRotation[0] -= g_MouseDelta[1] * 0.004;
	scene.CameraRotation[1] -= g_MouseDelta[0] * 0.004;
	var rotation_matrix = scene.UpdateRotationMatrix();
	g_MouseDelta[0] = 0;
	g_MouseDelta[1] = 0;

	// Construct movement vector frame from the rotation matrix
	var speed = 0.05;
	var forward = vec3.create();
	var right = vec3.create();
	var up = vec3.create();
	vec3.set(forward, 0, 0, -speed);
	vec3.set(right, speed, 0, 0);
	vec3.set(up, 0, speed, 0);
	vec3.transformMat4(forward, forward, rotation_matrix);
	vec3.transformMat4(right, right, rotation_matrix);

	// Move the camera based on what the user presses
	if (g_KeyState[Keys.W])
		vec3.add(scene.CameraPosition, scene.CameraPosition, forward);
	if (g_KeyState[Keys.S])
		vec3.sub(scene.CameraPosition, scene.CameraPosition, forward);
	if (g_KeyState[Keys.A])
		vec3.sub(scene.CameraPosition, scene.CameraPosition, right);
	if (g_KeyState[Keys.D])
		vec3.add(scene.CameraPosition, scene.CameraPosition, right);
	if (g_KeyState[Keys.SPACE])
		vec3.add(scene.CameraPosition, scene.CameraPosition, up);
	if (g_KeyState[Keys.SHIFT])
		vec3.sub(scene.CameraPosition, scene.CameraPosition, up);

	// Solid wireframe rendering of the scene
	gl.depthRange(0.01, 1);
	scene.DrawMeshes(gl.TRIANGLE_STRIP, Colours.BLACK);
	gl.depthRange(0, 1);
	scene.DrawMeshes(gl.LINES, Colours.WHITE);
}


function main(canvas_name)
{
	// Resize the width of the canvas to that of its parent
	var canvas = document.getElementById(canvas_name);
	canvas.width = canvas.parentNode.offsetWidth;

	// Initialise and exit on error
	var gl = InitWebGL(canvas);
	if (!gl)
		return null;
	InitInput(canvas);

	// Initialise the window with red backdrop
	gl.clearColor(1, 0, 0, 1);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Load the shaders
	var fshader = LoadShader(gl, "Fragment.fsh");
	var vshader = LoadShader(gl, "Vertex.vsh");
	if (fshader == null || vshader == null)
		return null;

	// Create the shader program
	var program = gl.createProgram();
	gl.attachShader(program, fshader);
	gl.attachShader(program, vshader);
	gl.linkProgram(program);

	// Return on any errors
	if (!gl.getProgramParameter(program, gl.LINK_STATUS))
	{
		FatalError("Link Error: " + gl.getProgramInfoLog(program));
		return null;
	}

	var scene = new Scene();
	scene.Init(gl, program, canvas);

    (function animloop(){
      requestAnimFrame(animloop);
      DrawScene(gl, scene);
    })();

	return scene;
}


function InitCodeMirror(text_area_name)
{	
	var cm = CodeMirror.fromTextArea(
		document.getElementById(text_area_name),
		configuration =
		{
			theme: "monokai",	
			mode: "javascript",
			indentUnit: 4,
			indentWithTabs: true,
			lineNumbers: true,
			gutter: true,
		});

	var h = document.getElementById("CanvasHost").offsetHeight;
	cm.setSize(null, h);
	return cm;
}


function ExecuteCode(cm, scene)
{
	var old_scene_meshes = scene.Meshes;
	scene.Meshes = [ ];

	var vars = { "scene" : scene };
	var code = "with (vars) { " + cm.getValue() + "}";

	try
	{
		eval(code);
		ClearError();
	}
	catch (e)
	{
		FatalError(e.message);
		scene.Meshes = old_scene_meshes;
	}
}


function SetupLiveEditEnvironment(canvas_name, text_area_name)
{
	// Create the WebGL context/scene
	var scene = main(canvas_name);

	// Start the code editor and eval the code
	var cm = InitCodeMirror(text_area_name);
	ExecuteCode(cm, scene);
	var last_code_hash = HashString(cm.getValue());

	// Check for code changes periodically
	setInterval(function()
	{
		var code_hash = HashString(cm.getValue());
		if (code_hash != last_code_hash)
		{
			last_code_hash = code_hash;
			ExecuteCode(cm, scene);
		}
	}, 1000);
}