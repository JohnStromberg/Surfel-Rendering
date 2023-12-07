#version 300 es
precision mediump float;
in vec4 fcolor;
in vec4 fNormal;
in vec4 fPosition;

out vec4 fragColor;

void main(){

    fragColor = fcolor;
    //fragColor = vec4(fNormal.xyz, 1.0);
}