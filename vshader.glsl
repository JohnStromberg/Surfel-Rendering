#version 300 es
precision mediump float;
in vec4 vPosition;
in vec4 vNormal;
in vec4 vSquare;
in vec4 vColor;
in vec2 texCoord;

out vec4 fcolor;
out vec2 ftexCoord;

uniform mat4 mv;
uniform mat4 proj;
uniform int onPoints;

void main(){
    vec3 N = normalize(vNormal).xyz;
    vec3 xvec = vec3(1, 0, 0);
    vec3 rotation_axis = normalize(cross(N, xvec));
    float theta = acos(dot(xvec, N));
    float cos_theta = cos(theta);
    float one_minus_cos_theta = 1.0 - cos(cos_theta);
    float sin_theta = sin(theta);

    mat3 rotation_mat = mat3(
    vec3(cos_theta + pow(rotation_axis.x, 2.0) * one_minus_cos_theta,
    rotation_axis.y * rotation_axis.x * one_minus_cos_theta + rotation_axis.z * sin_theta,
    rotation_axis.z * rotation_axis.x * one_minus_cos_theta - rotation_axis.y * sin_theta),
    vec3(rotation_axis.x * rotation_axis.y * one_minus_cos_theta - rotation_axis.z * sin_theta,
    cos_theta + pow(rotation_axis.y, 2.0) * one_minus_cos_theta,
    rotation_axis.z * rotation_axis.y * one_minus_cos_theta + rotation_axis.x * sin_theta),
    vec3(rotation_axis.x * rotation_axis.z * one_minus_cos_theta + rotation_axis.y * sin_theta,
    rotation_axis.y * rotation_axis.z * one_minus_cos_theta - rotation_axis.x * sin_theta,
    cos_theta + pow(rotation_axis.z, 2.0) * one_minus_cos_theta));

    vec4 finalPosition = vec4(rotation_mat * vSquare.xyz, 1.0);
    finalPosition = vec4(finalPosition.xyz + vPosition.xyz, 1.0);

    gl_Position = proj*mv*finalPosition;
    gl_PointSize = 1.0;

    fcolor = vColor;
    ftexCoord = texCoord;
}