#version 300 es
uniform mat4 mv;
uniform mat4 proj;

in vec4 vPosition;
in vec4 vNormal;
in vec4 vTangent;
in vec4 vColor;
in vec2 texCoord;

out vec4 fNormal;
out vec4 fcolor;
out vec2 ftexCoord;

uniform int onPoints;

void main(){
//    vec3 N = normalize(mv*vNormal).xyz;
//    vec3 tempVec = vec3(0, 0, 1);
//    vec3 T = cross(N, tempVec);
//    vec3 binormal = cross(N, T);
//    mat4 transMatrix = mat4(vec4(N, 0.0), vec4(T, 0.0), vec4(binormal, 0.0), vec4(0, 0, 0, 1));
//    vec4 finalPosition = transMatrix * vPosition;

    vec3 N = normalize(vNormal).xyz;
    vec3 tempVec = vec3(0, 1, 0);
    vec3 rotation_axis = cross(tempVec, N);
    float rotation_ang = dot(tempVec, N);
    float cos_angle = cos(rotation_ang);
    float other_cos_angle = 1.0 - cos_angle;
    float sin_angle = sin(rotation_ang);

    mat4 rotation_mat = mat4(
    vec4(cos_angle + pow(rotation_axis.x, 2.0) * other_cos_angle,
    rotation_axis.y * rotation_axis.x * other_cos_angle + rotation_axis.z * sin_angle,
    rotation_axis.z * rotation_axis.x * other_cos_angle - rotation_axis.y * sin_angle, 0.0),
    vec4(rotation_axis.x * rotation_axis.y * other_cos_angle - rotation_axis.z * sin_angle,
    cos_angle + pow(rotation_axis.y, 2.0) * other_cos_angle,
    rotation_axis.z * rotation_axis.y * other_cos_angle + rotation_axis.x * sin_angle, 0.0),
    vec4(rotation_axis.x * rotation_axis.z * other_cos_angle + rotation_axis.y * sin_angle,
    rotation_axis.y * rotation_axis.z * other_cos_angle - rotation_axis.x * sin_angle,
    cos_angle + pow(rotation_axis.z, 2.0) * other_cos_angle, 0.0),
    vec4(0.0, 0.0, 0.0, 1.0));

    vec4 finalPosition = rotation_mat * vPosition;

    gl_Position = proj*mv*finalPosition;
    gl_PointSize = 1.0;

    fcolor = vColor;
    ftexCoord = texCoord;
    fNormal = vNormal;
}