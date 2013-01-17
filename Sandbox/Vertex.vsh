
attribute vec3 glVertex;

uniform mat4 glModelViewMatrix;
uniform mat4 glProjectionMatrix;

void main(void)
{
	gl_Position = glProjectionMatrix * glModelViewMatrix * vec4(glVertex, 1.0);
}