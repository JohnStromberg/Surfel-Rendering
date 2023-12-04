import {
    initShaders,
    vec4,
    mat4,
    flatten,
    perspective,
    lookAt,
    rotateX,
    rotateY,
    initFileShaders
} from "./helperfunctions.js";

"use strict";
let gl:WebGLRenderingContext;
let program:WebGLProgram;

//uniform locations
let umv:WebGLUniformLocation; //uniform for mv matrix
let uproj:WebGLUniformLocation; //uniform for projection matrix

//matrices
let mv:mat4; //local mv
let p:mat4; //local projection

//The number of vertices to draw
let numVerts:number;

//amount of zoom
let zoom:number;

//document elements
let canvas:HTMLCanvasElement;

//interaction and rotation state
let xAngle:number;
let yAngle:number;
let mouse_button_down:boolean = false;
let prevMouseX:number = 0;
let prevMouseY:number = 0;

//mesh vars
let meshVertexBufferID:WebGLBuffer;
let indexBufferID:WebGLBuffer;

let meshVertexData:vec4[];

window.onload = function init() {

    canvas = document.getElementById("gl-canvas") as HTMLCanvasElement;
    gl = canvas.getContext('webgl2') as WebGLRenderingContext;
    if (!gl) {
        alert("WebGL isn't available");
    }
    ///////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////
    //https://codepen.io/matt-west/pen/KjEHg
    //converted to typescript by Nathan Gossett
    let fileInput:HTMLInputElement = document.getElementById("fileInput") as HTMLInputElement;
    fileInput.addEventListener('change', function(e){
        let file:File = fileInput.files[0];
        let reader:FileReader = new FileReader();
        reader.onload = function(e){
            createMesh(reader.result as string); //ok, we have our data, so parse it
            requestAnimationFrame(render); //ask for a new frame
        };
        reader.readAsText(file);
    });
    ////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////

    //allow the user to rotate mesh with the mouse
    canvas.addEventListener("mousedown", mouse_down);
    canvas.addEventListener("mousemove", mouse_drag);
    canvas.addEventListener("mouseup", mouse_up);

    //start as blank arrays
    meshVertexData = [];

    //white background
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initFileShaders(gl, "vshader.glsl", "fshader.glsl");
    gl.useProgram(program);

    umv = gl.getUniformLocation(program, "mv");
    uproj = gl.getUniformLocation(program, "proj");

    zoom = 10;

    //set up basic perspective viewing
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    p = perspective(zoom, (canvas.clientWidth / canvas.clientHeight), 1, 500);
    gl.uniformMatrix4fv(uproj, false, p.flatten());

    //This function executes whenever a user hits a key
    window.addEventListener("keydown" ,function(event){
        switch(event.key) {
            case "ArrowUp":
                if(zoom > 10) {
                    zoom -= 5;
                }
                break;
            case "ArrowDown":
                if(zoom < 170) {
                    zoom += 5;
                }
        }
        console.log(zoom);
        p = perspective(zoom, (canvas.clientWidth / canvas.clientHeight), 1, 500);
        gl.uniformMatrix4fv(uproj, false, p.flatten());
        requestAnimationFrame(render);
    });


    //initialize rotation angles
    xAngle = 0;
    yAngle = 0;
};

/**
 * Parse string into list of vertices and triangles
 * Not robust at all, but simple enough to follow as an introduction
 * @param input string of ascii floats
 */
function createMesh(input:string){
    //Splits the file so that every word/number is on a new line
    let numbers:string[] = input.split(/\s+/);
    console.log(numbers);
    //The 9th element is the number of vertices
    numVerts = parseInt(numbers[9]);
    console.log(numVerts)
    let positionData:vec4[] = [];
    let normalData:vec4[] = [];
    let colorData:vec4[] = [];

    //The 49th position is the first position with actual data in it
    //
    for(let i:number = 49; i < 10*numVerts + 49; i+= 10){
        positionData.push(new vec4(parseFloat(numbers[i]), parseFloat(numbers[i+1]), parseFloat(numbers[i+2]), 1));
        normalData.push(new vec4(parseInt(numbers[i+3]), parseInt(numbers[i+4]), parseInt(numbers[i+5]), 0));
        colorData.push(new vec4(parseFloat(numbers[i+6]), parseFloat(numbers[i+7]), parseFloat(numbers[i+8]), parseFloat(numbers[i+9])));
    }


    //at this point, every vertex normal is the sum of all the normal vectors of the triangles that meet up at that vertex
    //so normalize to get a unit length average normal direction for the vertex
    // for(let i:number = 0; i < normalData.length; i++){
    //     normalData[i] = normalData[i].normalize();
    // }

    //and put that all together into an array so we can buffer it to graphics memory
    meshVertexData = [];
    for(let i:number = 0; i < numVerts; i++){
        meshVertexData.push(positionData[i]);
        //meshVertexData.push(normalData[i]);
        //meshVertexData.push(colorData[i]);
    }

    console.log(flatten(meshVertexData));

    //buffer vertex data and enable vPosition attribute
    meshVertexBufferID = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, meshVertexBufferID);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(meshVertexData), gl.STATIC_DRAW);

    //Data is packed in groups of 4 floats which are 4 bytes each, 32 bytes total for position and color
    // position                        Normal                   Color
    //  x   y   z    w        x    y       z      w      r      g    b     a
    // 0-3 4-7 8-11 12-15  16-19  20-23  24-27  28-31  32-35  36-39 40-43 44-47


    let vPosition:GLint = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(vPosition);

    // let vNormal:GLint = gl.getAttribLocation(program, "vNormal");
    // gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 48, 16);
    // gl.enableVertexAttribArray(vNormal);
    //
    // let vColor:GLint = gl.getAttribLocation(program, "vColor");
    // gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 48, 32);
    // gl.enableVertexAttribArray(vColor);


}

//update rotation angles based on mouse movement
function mouse_drag(event:MouseEvent){
    let thetaY:number, thetaX:number;
    if (mouse_button_down) {
        thetaY = 360.0 *(event.clientX-prevMouseX)/canvas.clientWidth;
        thetaX = 360.0 *(event.clientY-prevMouseY)/canvas.clientHeight;
        prevMouseX = event.clientX;
        prevMouseY = event.clientY;
        xAngle += thetaX;
        yAngle += thetaY;
    }
    requestAnimationFrame(render);
}

//record that the mouse button is now down
function mouse_down(event:MouseEvent) {
    //establish point of reference for dragging mouse in window
    mouse_button_down = true;
    prevMouseX= event.clientX;
    prevMouseY = event.clientY;
    requestAnimationFrame(render);
}

//record that the mouse button is now up, so don't respond to mouse movements
function mouse_up(){
    mouse_button_down = false;
    requestAnimationFrame(render);
}

//draw a frame
function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //position camera 10 units back from origin
    mv = lookAt(new vec4(0, 0, 2, 1), new vec4(0, 0, 0, 1), new vec4(0, 1, 0, 0));

    //rotate if the user has been dragging the mouse around
    mv = mv.mult(rotateY(yAngle).mult(rotateX(xAngle)));

    //send the modelview matrix over
    gl.uniformMatrix4fv(umv, false, mv.flatten());

    //if we've loaded a mesh, draw it
    if(meshVertexData.length > 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, indexBufferID);
        //note that we're using gl.drawElements() here instead of drawArrays()
        //this allows us to make use of shared vertices between triangles without
        //having to repeat the vertex data.  However, if each vertex has additional
        //attributes like color, normal vector, texture coordinates, etc that are not
        //shared between triangles like position is, than this might cause problems
        gl.drawArrays(gl.POINTS, 0, numVerts);
    }
}