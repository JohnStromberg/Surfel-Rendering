#version 300 es
precision mediump float;
in vec4 fcolor;
in vec4 fNormal;
in vec4 fPosition;
in vec2 ftexCoord;

out vec4 fragColor;

uniform sampler2D textureSampler;
uniform int onPoints;

void main(){
    if(onPoints == 1) {
        fragColor = fcolor;
    } else {
        fragColor = vec4(fcolor.xyz, texture(textureSampler, ftexCoord).a);
    }
}