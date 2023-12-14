#version 300 es
precision mediump float;
uniform mat4 mv;
uniform mat4 proj;

in vec4 vPosition;
in vec4 vNormal;
in vec4 vSquare;
in vec4 vColor;
in vec2 texCoord;

out vec4 fNormal;
out vec4 fcolor;
out vec2 ftexCoord;

uniform int onPoints;

void main(){
    vec3 N = normalize(vNormal).xyz;
    vec3 tempVec = vec3(1, 0, 0);
    vec3 rotation_axis = normalize(cross(N, tempVec));
    float rotation_ang = acos(dot(tempVec, N));
    float cos_angle = cos(rotation_ang);
    float other_cos_angle = 1.0 - cos(cos_angle);
    float sin_angle = sin(rotation_ang);

    mat3 rotation_mat = mat3(
    vec3(cos_angle + pow(rotation_axis.x, 2.0) * other_cos_angle,
    rotation_axis.y * rotation_axis.x * other_cos_angle + rotation_axis.z * sin_angle,
    rotation_axis.z * rotation_axis.x * other_cos_angle - rotation_axis.y * sin_angle),
    vec3(rotation_axis.x * rotation_axis.y * other_cos_angle - rotation_axis.z * sin_angle,
    cos_angle + pow(rotation_axis.y, 2.0) * other_cos_angle,
    rotation_axis.z * rotation_axis.y * other_cos_angle + rotation_axis.x * sin_angle),
    vec3(rotation_axis.x * rotation_axis.z * other_cos_angle + rotation_axis.y * sin_angle,
    rotation_axis.y * rotation_axis.z * other_cos_angle - rotation_axis.x * sin_angle,
    cos_angle + pow(rotation_axis.z, 2.0) * other_cos_angle));

    vec4 finalPosition = vec4(rotation_mat * vSquare.xyz, 1.0);
    finalPosition = vec4(finalPosition.xyz + vPosition.xyz, 1.0);

    gl_Position = proj*mv*finalPosition;
    gl_PointSize = 1.0;

    fcolor = vColor;
    ftexCoord = texCoord;
    fNormal = vNormal;
}