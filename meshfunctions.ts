import {
    initShaders,
    vec4,
    mat4,
    flatten,
    perspective,
    lookAt,
    rotateX,
    rotateY,
    initFileShaders,
    rotateZ,
    toradians, todegrees, vec2
} from "./helperfunctions.js";

"use strict";
let gl:WebGLRenderingContext;
let program:WebGLProgram;

//uniform locations
let umv:WebGLUniformLocation; //uniform for mv matrix
let uproj:WebGLUniformLocation; //uniform for projection matrix
let vPosition:GLint;
let vNormal:GLint;
let vColor:GLint;
let vTexCoord:GLint;

//matrices
let mv:mat4; //local mv
let p:mat4; //local projection

//The number of vertices to draw
let numVerts:number;

//amount of zoom
let zoom:number;

//The texture filter
let filterTex:WebGLTexture;
//this will be a pointer to our sampler2D
let uTextureSampler:WebGLUniformLocation;

//We need the normal vectors to rotate each quad
let normalData:vec4[]

//The amount of offset used to make the quads
let xOffSet:number;
let yOffSet:number;

let onPoints;
let onPointsUniform:WebGLUniformLocation;


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

let meshVertexData:any[];

window.onload = function init() {

    canvas = document.getElementById("gl-canvas") as HTMLCanvasElement;
    gl = canvas.getContext('webgl2') as WebGLRenderingContext;
    if (!gl) {
        alert("WebGL isn't available");
    }

    makeTexture();
    readTextFile("./Point Clouds/Cone v2.ply");

    //allow the user to rotate mesh with the mouse
    canvas.addEventListener("mousedown", mouse_down);
    canvas.addEventListener("mousemove", mouse_drag);
    canvas.addEventListener("mouseup", mouse_up);

    //start as blank arrays
    meshVertexData = [];
    normalData = [];

    //white background
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initFileShaders(gl, "vshader.glsl", "fshader.glsl");
    gl.useProgram(program);

    umv = gl.getUniformLocation(program, "mv");
    uproj = gl.getUniformLocation(program, "proj");
    vPosition = gl.getAttribLocation(program, "vPosition");
    vNormal = gl.getAttribLocation(program, "vNormal");
    vColor = gl.getAttribLocation(program, "vColor");
    vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    uTextureSampler = gl.getUniformLocation(program, "textureSampler");
    onPointsUniform = gl.getUniformLocation(program, "onPoints");

    zoom = 45;
    xOffSet = 0.01;
    yOffSet = 0.003;
    onPoints = false;
    gl.uniform1i(onPointsUniform, 0);
    //set up basic perspective viewing
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    p = perspective(zoom, (canvas.clientWidth / canvas.clientHeight), 1, 500);
    gl.uniformMatrix4fv(uproj, false, p.flatten());

    //This function executes whenever a user hits a key
    window.addEventListener("keydown" ,function(event){
        switch(event.key) {

        }
    });

    window.addEventListener('wheel', function(event) {
        // Get the distance that the mouse wheel was rotated
        const delta = event.deltaY;
        if (delta > 0) {
            if(zoom < 170) {
                zoom += 2;
            }
        // The wheel was rotated upwards or away from the user
        } else if (delta < 0) {
            if(zoom > 10) {
                zoom -= 2;
            }
        // The wheel was rotated downwards or towards the user
        }
        p = perspective(zoom, (canvas.clientWidth / canvas.clientHeight), 1, 500);
        gl.uniformMatrix4fv(uproj, false, p.flatten());
        requestAnimationFrame(render);
    });


    //initialize rotation angles
    xAngle = 0;
    yAngle = 0;
};

function readTextFile(filePath:string) {
    fetch(filePath)
        .then(response => response.text())
        .then(text => {
            createPointCloud(text as string) //ok, we have our data, so parse it
            requestAnimationFrame(render) //ask for a new frame
        })
    // outputs the content of the text file
}

/**
 * Creates a point cloud from a .ply file
 * @param input string of ascii floats
 */
function createPointCloud(input:string){
    //Splits the file so that every word/number is on a new line
    let numbers:string[] = input.split(/\s+/);
    //The 9th element is the number of vertices
    numVerts = parseInt(numbers[9]);
    let positionData:vec4[] = [];
    let colorData:vec4[] = [];
    let textureCoords:vec2[] = [];

    //The 49th position is the first position with actual data in it
    //
    if(onPoints) {
        for(let i:number = 49; i < 10*numVerts + 49; i+= 10){
            positionData.push(new vec4(parseFloat(numbers[i]) * 10, parseFloat(numbers[i+1]) * 10, parseFloat(numbers[i+2]) * 10, 1));
            normalData.push(new vec4(parseFloat(numbers[i+3]), parseFloat(numbers[i+4]), parseFloat(numbers[i+5]), 0));
            colorData.push(new vec4(parseFloat(numbers[i+6])/255, parseFloat(numbers[i+7])/255, parseFloat(numbers[i+8])/255, parseFloat(numbers[i+9])/255));
            textureCoords.push(new vec2(0, 0));
        }
    } else {
        for(let i:number = 49; i < 10*numVerts + 49; i+= 10){
            positionData.push(new vec4((parseFloat(numbers[i]) * 10) + xOffSet, (parseFloat(numbers[i+1]) * 10) + yOffSet, parseFloat(numbers[i+2]) * 10, 1));
            normalData.push(new vec4(parseFloat(numbers[i+3]), parseFloat(numbers[i+4]), parseFloat(numbers[i+5]), 0));
            colorData.push(new vec4(parseFloat(numbers[i+6])/255, parseFloat(numbers[i+7])/255, parseFloat(numbers[i+8])/255, parseFloat(numbers[i+9])/255));
            textureCoords.push(new vec2(1, 1));

            positionData.push(new vec4((parseFloat(numbers[i]) * 10) - xOffSet, (parseFloat(numbers[i+1]) * 10) + yOffSet, parseFloat(numbers[i+2]) * 10, 1));
            normalData.push(new vec4(parseFloat(numbers[i+3]), parseFloat(numbers[i+4]), parseFloat(numbers[i+5]), 0));
            colorData.push(new vec4(parseFloat(numbers[i+6])/255, parseFloat(numbers[i+7])/255, parseFloat(numbers[i+8])/255, parseFloat(numbers[i+9])/255));
            textureCoords.push(new vec2(1, 0));

            positionData.push(new vec4((parseFloat(numbers[i]) * 10) + xOffSet, (parseFloat(numbers[i+1]) * 10) - yOffSet, parseFloat(numbers[i+2]) * 10, 1));
            normalData.push(new vec4(parseFloat(numbers[i+3]), parseFloat(numbers[i+4]), parseFloat(numbers[i+5]), 0));
            colorData.push(new vec4(parseFloat(numbers[i+6])/255, parseFloat(numbers[i+7])/255, parseFloat(numbers[i+8])/255, parseFloat(numbers[i+9])/255));
            textureCoords.push(new vec2(0, 1));

            positionData.push(new vec4((parseFloat(numbers[i]) * 10) - xOffSet, (parseFloat(numbers[i+1]) * 10) - yOffSet, parseFloat(numbers[i+2]) * 10, 1));
            normalData.push(new vec4(parseFloat(numbers[i+3]), parseFloat(numbers[i+4]), parseFloat(numbers[i+5]), 0));
            colorData.push(new vec4(parseFloat(numbers[i+6])/255, parseFloat(numbers[i+7])/255, parseFloat(numbers[i+8])/255, parseFloat(numbers[i+9])/255));
            textureCoords.push(new vec2(0, 0));
        }
    }

    //and put that all together into an array so we can buffer it to graphics memory
    meshVertexData = [];

    for (let i: number = 0; i < positionData.length; i++) {
        meshVertexData.push(positionData[i]);
        meshVertexData.push(normalData[i]);
        meshVertexData.push(colorData[i]);
        meshVertexData.push(textureCoords[i]);
    }

    //buffer vertex data and enable vPosition attribute
    meshVertexBufferID = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, meshVertexBufferID);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(meshVertexData), gl.STATIC_DRAW);

    //Data is packed in groups of 4 floats which are 4 bytes each, 48 bytes total for position, normals and color
    //       position            Normal                   Color                     Texture
    //  x   y   z    w        x    y       z      w      r      g    b     a       x      y
    // 0-3 4-7 8-11 12-15  16-19  20-23  24-27  28-31  32-35  36-39 40-43 44-47   48-51   52-55


    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 56, 0);
    gl.enableVertexAttribArray(vPosition);

    vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 56, 16);
    gl.enableVertexAttribArray(vNormal);

    vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 56, 32);
    gl.enableVertexAttribArray(vColor);

    vTexCoord = gl.getAttribLocation(program, "texCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 56, 48);
    gl.enableVertexAttribArray(vTexCoord);
}

function makeTexture() {
    const texHeight:number = 5;
    const texWidth:number = 5;
    //mmtexture is the main memory texture
    let mmtexture:Uint8Array = new Uint8Array(texHeight * texWidth * 4);

    let rowOneFiveValues:number[] = [0, 50, 100, 24.735, 0];
    let rowTwoFourValues:number[] = [50, 255, 255, 255, 50];
    let rowThreeValues:number[] = [100, 255, 255, 255, 100];

    for (let i:number = 0; i < texHeight; i++) {
        for (let j:number = 0; j < texWidth; j++) {
            mmtexture[4*(texWidth * i + j)] = 255;
            mmtexture[4*(texWidth * i + j)+1] = 255;
            mmtexture[4*(texWidth * i + j)+2] = 255;
            if(i == 0 || i == 4) {
                mmtexture[4*(texWidth * i + j)+3] = rowOneFiveValues[j];
            } else if(i == 1 || i == 3) {
                mmtexture[4*(texWidth * i + j)+3] = rowTwoFourValues[j];
            } else {
                mmtexture[4*(texWidth * i + j)+3] = rowThreeValues[j];
            }
        }
    }
    //now create a texture object [in graphics memory hopefully]
    filterTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, filterTex);
    //this is a 2D texture, full resolution (level 0), RGBA now, texWidth by texHeight texels big, has no border
    // and should also be RGBA in video memory, currently each
    //texel is stored as unsigned bytes, and you can find all the texels in mmtexture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texWidth, texHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, mmtexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);//try different min and mag filters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
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


    if(onPoints) {
        gl.bindBuffer(gl.ARRAY_BUFFER, indexBufferID);
        gl.drawArrays(gl.POINTS, 0, numVerts);
    } else {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        for(let i = 0; i < numVerts; i++) {
            gl.activeTexture(gl.TEXTURE0); //we're using texture unit 0
            gl.bindTexture(gl.TEXTURE_2D, filterTex); //we want checkerTex on that texture unit
            gl.uniform1i(uTextureSampler, 0);

            gl.drawArrays(gl.TRIANGLE_STRIP, i*4, 4);
        }
    }
}


//https://www.numerical-tours.com/matlab/graphics_1_synthesis_gaussian/

//Look at change of coord matrices from the lextures
//Only need to change 1 direction since the texture will take care of it
//https://moodle.bethel.edu/pluginfile.php/3782358/mod_resource/content/0/COS320Fa2023-09-Viewing.pdf

//I think I need to use linear filtering.