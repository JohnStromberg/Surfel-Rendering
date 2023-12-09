#version 300 es
uniform mat4 mv;
uniform mat4 proj;

in vec4 vPosition;
in vec4 vNormal;
in vec4 vColor;
in vec2 texCoord;

out vec4 fcolor;
out vec4 fNormal;
out vec4 fPosition;
out vec2 ftexCoord;

void main(){
    gl_Position = proj*mv*vPosition;
    gl_PointSize = 1.0;

    fNormal = vNormal;
    fcolor = vColor;
    fPosition = vPosition;
    ftexCoord = texCoord;
}