#version 300 es
uniform mat4 mv;
uniform mat4 proj;

in vec4 vPosition;
in vec4 vNormal;
in vec4 vColor;

out vec4 fcolor;
out vec4 fNormal;
out vec4 fPosition;

void main(){
    gl_Position = proj*mv*vPosition;
    gl_PointSize = 1.0;
    //as a last ditch debugging strategy we can treat any vector as a color vector.
    //red is our x coordinate, green is our y coordinate, blue is our z coordinate
    //color = vec4(vNormal.xyz, 1); //Normal vector has w coordinate of 0

    fNormal = vNormal;
    fcolor = vColor;
    fPosition = vPosition;
}