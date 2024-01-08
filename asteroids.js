
const canvasWidth = 1200;
const canvasHeight = 800;
let canvas;
let context;

let secondsPassed = 0;
let oldTimeStamp = 0;
let fps;
let hud;

let gameManager;
let inputManager;
let gameObjects = [];

document.addEventListener('DOMContentLoaded', init); 

function init(){
    canvas = document.getElementById('my-canvas');
    context = canvas.getContext('2d');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    clearScreen();

    gameManager = new GameManager;
    inputManager = new InputManager;
    document.body.addEventListener("keydown", function(e){inputManager.KeyDown(e.keyCode)});
    document.body.addEventListener("keyup", function(e){inputManager.KeyUp(e.keyCode)});

    // livesCounter = new LivesCounter(context);
    // timersHUD = new TimersHUD(context);
    
    gameObjects.push(new TimersHUD());
    gameObjects.push(new LivesCounter());
    gameObjects.push(new Ship());

    for(let i = 0; i < 7; i++){
        gameObjects.push(new Asteroid());
    }

    window.requestAnimationFrame(gameLoop);
}

function clearScreen(){
    context.fillStyle = 'black';
    context.fillRect(0,0,canvasWidth,canvasHeight); 
}


function gameLoop(timeStamp) {
    secondsPassed = (timeStamp - oldTimeStamp) / 1000;
    oldTimeStamp = timeStamp;

    // Calculate fps
    fps = Math.round(1 / secondsPassed);

    clearScreen();

    // Loop over all game objects and update.
    for (let i = 0; i < gameObjects.length; i++) {
        gameObjects[i].Update(secondsPassed);
    }

    detectCollisions();

    // Loop over all game objects and draw.
    for (let i = 0; i < gameObjects.length; i++) {
        gameObjects[i].Render();
    }

    window.requestAnimationFrame(gameLoop);
}

function detectCollisions(){
    let obj1;
    let obj2;

    // Reset collision state for all PhysicsObjects.
    for(let i=0; i < gameObjects.length; i++) {
        if(gameObjects[i] instanceof PhysicsObject){
            gameObjects[i].isColliding = false; 
        }
    }

    // Check Physics objects for Collisions
    for (let i=0; i < gameObjects.length; i++){
        obj1 = gameObjects[i];

        if (obj1 instanceof PhysicsObject){
            for (let j=0; j < gameObjects.length; j++){
                obj2 = gameObjects[j];
                
                if (obj2 instanceof PhysicsObject && i !==j){

                    // Compare object1 with object2
                    // if(CircleCollision(obj1.x, obj1.y, obj1.collisionRadius, obj2.x, obj2.y, obj2.collisionRadius)){
                    //     console.log(`Collision detcted between ${obj1} and ${obj2}`);
                    //     obj1.isColliding = true;
                    //     obj1.isColliding = true;
                    // }
                    if(circleIntersect(obj1.x, obj1.y, obj1.collisionRadius, obj2.x, obj2.y, obj2.collisionRadius)){
                        console.log(`Collision detcted between ${obj1} and ${obj2}`);
                        obj1.isColliding = true;
                        obj1.isColliding = true;
                    }
                }
            }
        }
    }
}

// function CircleCollision(p1x, p1y, r1, p2x, p2y, r2){
//     let radiusSum;
//     let xDiff;
//     let yDiff;
//     radiusSum = r1 + r2;
//     xDiff = p1x - p2x;
//     yDiff = p1y - p2y;
//     if(radiusSum > Math.sqrt((xDiff * xDiff) + (yDiff * yDiff))){
//         return true;
//     }
//     return false;
// }

function circleIntersect(x1, y1, r1, x2, y2, r2){
    // Calculate the distance between the two circles
    let squareDistance = (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);

    // When the distance is smaller or equal to the sum of the two radius, the circles touch or overlap
    return squareDistance <= ((r1 + r2) * (r1 + r2))
}


class GameManager {
    constructor(){
        this.gameState = 'START'; // START, RUNNING, PAUSE, GAME_OVER
        this.currentLives = 3;
        this.currentScore = 0;
    }
    NewGame(){
        this.gameState = 'RUNNING';
        this.currentLives = 3;
        this.currentScore = 0;
    }
    PauseGame(){
        this.gameState = 'PAUSED';
    }
    GameOver(){
        this.gameState = 'GAME_OVER';
    }
}

class InputManager {
    constructor(){
        this.actions = {
            leftButton: false,
            rightButton: false,
            forwardButton: false,
            fireButton: false,
            startButton: false
        }
    }
    KeyDown(keyCode){
        // UpArrow or W key pressed.
        if(keyCode === 38 || keyCode == 87) this.actions.forwardButton = true;

        // LeftArrow or A key pressed.
        if(keyCode === 37 || keyCode == 65) this.actions.leftButton = true;

        // RightArrow or D key pressed.
        if(keyCode === 39 || keyCode == 68) this.actions.rightButton = true; 

        // Spacebar key pressed.
        if(keyCode === 32) this.actions.fireButton = true;

        // Enter key pressed.
        if(keyCode === 13) this.actions.startButton = true;
    }
    KeyUp(keyCode){
        // UpArrow or W key pressed.
        if(keyCode === 38 || keyCode === 87) this.actions.forwardButton = false;

        // LeftArrow or A key pressed.
        if(keyCode === 37 || keyCode === 65) this.actions.leftButton = false;

        // RightArrow or D key pressed.
        if(keyCode === 39 || keyCode === 68) this.actions.rightButton = false;

        // Spacebar key pressed.
        if(keyCode === 32) this.actions.fireButton = false;

        // Enter key pressed.
        if(keyCode === 13) this.actions.startButton = false;
    }
}

class GameObject {
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
    Update(){

    }
    Render(){

    }
}

class HudElement extends GameObject {
    constructor(startX, startY){
        super(startX, startY);
        this.color = 'white';
    }
}

class LivesCounter extends HudElement {
    constructor(){
        super(1175, 10);     
        this.lives = gameManager.currentLives;
    }
    Update(){
        this.lives = gameManager.currentLives;
    }
    Render(){
        let points = [[9,9],[-9,9]];
        let renderX = this.x 
        context.strokeStyle = this.color;

        for(let i = 0; i < this.lives; i++){
            context.beginPath();
            context.moveTo(renderX, this.y);
            for(let j = 0; j < points.length; j++){
                context.lineTo(renderX + points[j][0], this.y + points[j][1]);
            }
            context.closePath();
            context.stroke();
            renderX -= 30;
        }
    }
}

class TimersHUD extends HudElement {
    constructor(){
        super(canvasWidth-125, canvasHeight-25);     
    }
    Render(){
        context.font = '25px Arial';
        context.fillStyle = 'white';
        context.fillText("FPS: " + fps, this.x, this.y);
        // context.fillText("SP: " + secondsPassed, this.x-50, this.y-40);      
    }
}

class PhysicsObject extends GameObject {
    constructor(x, y, velocityX, velocityY, collisionRadius){
        super(x, y);
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.collisionRadius = collisionRadius;
        this.renderCollision = true; // Useful for debugging.
        this.isColliding = false; 
    }
    Render(){
        if(this.renderCollision){
            context.beginPath();
            context.strokeStyle = this.isColliding ? 'red' : 'yellow';
            context.arc(this.x, this.y, this.collisionRadius,0,2* Math.PI);
            context.closePath();
            context.stroke();
        }
    }
}

class Ship extends PhysicsObject {
    constructor(){
        super(canvasWidth / 2 , canvasHeight / 2, 0, 0, 11);
        this.speed = 10;
        this.rotateSpeed = 0.075;
        this.radius = 15;
        // this.collisionRadius = 11;
        this.dirModifier = 0;
        this.angle = 0;
        this.strokeColor = 'white';
        this.noseX = canvasWidth / 2 + 15;
        this.noseY = canvasHeight / 2;
        this.movingForward = false;
    }
    Update(secondsPassed){
        // Check for inputs affecting ship actions.
        this.movingForward = inputManager.actions.forwardButton;
        this.dirModifier = 0;
        if(inputManager.actions.leftButton) this.dirModifier = -1;
        if(inputManager.actions.rightButton) this.dirModifier = 1;
        if(inputManager.actions.fireButton){
            //fire bullets
            console.log("Pew pew");
        };

        let radians = this.angle / Math.PI * 180; //convert from degrees to radians.

        // Increase velocity if movingForward.
        if(this.movingForward) {
            this.velocityX += Math.cos(radians) * this.speed;
            this.velocityY += Math.sin(radians) * this.speed;
        }

        // Move the ship to the other side of the screen if we move out of bounds.
        if(this.x < this.radius) this.x = canvas.width; 
        if(this.x > canvas.width) this.x = this.radius; 
        if(this.y < this.radius) this.y = canvas.height; 
        if(this.y > canvas.height) this.y = this.radius; 

        // Reduce velocity. Imposes speed cap.
        this.velocityX *= 0.99;
        this.velocityY *= 0.99;

        this.angle += (this.rotateSpeed * this.dirModifier) * secondsPassed;
        this.x -= (this.velocityX * secondsPassed);
        this.y -= (this.velocityY * secondsPassed);
    }
    Render(){
        super.Render();

        context.strokeStyle = this.strokeColor;
        context.beginPath();
        let vertAngle = ((Math.PI * 2) /3);
        let radians = this.angle / Math.PI * 180;
        this.noseX = this.x - this.radius * Math.cos(radians);
        this.noseY = this.y - this.radius * Math.sin(radians);
        for(let i = 0; i < 3; i++){
            context.lineTo(this.x - this.radius * Math.cos(vertAngle * i + radians), this.y - this.radius * Math.sin(vertAngle * i + radians))
        }
        context.closePath();
        context.stroke();

        // Front nose marker. 
        context.beginPath();
        context.strokeStyle = 'green';
        context.arc(this.noseX, this.noseY, 2,0,2* Math.PI);
        context.closePath();
        context.stroke();
    }
}


class Asteroid extends PhysicsObject {
    constructor(startX, startY, level, speed, radius, collisionRadius){
        super();
        this.x = startX || Math.floor(Math.random() * canvasWidth);
        this.y = startY || Math.floor(Math.random() * canvasHeight);
        this.speed = speed || 200;
        this.radius = radius || 50;
        this.angle = Math.floor(Math.random() * 328); // this affects our rotation of sprite. Will be what should change over time for spinning asteroids.
        this.strokeColor = 'white';
        this.collisionRadius = collisionRadius || 46;
        this.level = level || 1;
    }
    Update(){
        // this.angle += 0.1 * secondsPassed;
        var radians = this.angle / Math.PI * 180;

        this.x += Math.cos(radians) * this.speed * secondsPassed;
        this.y += Math.sin(radians) * this.speed * secondsPassed;

        // Move the asteroid to the other side of the screen if we move out of bounds.
        if(this.x < (this.radius/2)) this.x = canvas.width;
        if(this.x > canvas.width) this.x = this.radius; 
        if(this.y < (this.radius/2)) this.y = canvas.height;
        if(this.y > canvas.height) this.y = this.radius;
    }
    Render(){
        super.Render();

        context.strokeStyle = this.strokeColor;
        context.beginPath();
        let vertAngle = ((Math.PI * 2) / 6);
        var radians = this.angle / Math.PI * 180;
        for(let i = 0; i < 6; i++){
            context.lineTo(this.x - this.radius * Math.cos(vertAngle * i + radians), this.y - this.radius * Math.sin(vertAngle * i + radians))
        }
        context.closePath();
        context.stroke();
    }
}


// class Asteroid extends PhysicsObject {
//     constructor(ctx, x, startY, level, collisionRadius){
//         super(ctx);
//         this.x = x || Math.floor(Math.random() * canvasWidth);
//         this.y = y || Math.floor(Math.random() * canvasHeight);
//         this.speed = 10;
//         this.rotateSpeed = 0.075;
//         this.radius = 15;
//         // this.collisionRadius = 11;
//         this.dirModifier = 0;
//         this.angle = 0;
//         this.strokeColor = 'white';
//         this.noseX = canvasWidth / 2 + 15;
//         this.noseY = canvasHeight / 2;
//         this.movingForward = false;
//     }
// }



// class Asteroid {
//     constructor(x,y,radius, level,collisionRadius){
//         this.visible = true;
//         this.x = x || Math.floor(Math.random() * canvasWidth);
//         this.y = y || Math.floor(Math.random() * canvasHeight);
//         this.speed = 1.25;
//         // this.speed = 0;
//         this.radius = radius || 50;
//         this.angle = Math.floor(Math.random() * 359);
//         this.strokeColor = 'white';
//         this.collisionRadius = collisionRadius || 46;
//         this.level = level || 1;
//     }
//     Update(){
//         var radians = this.angle / Math.PI * 180;
//         this.x += Math.cos(radians) * this.speed;
//         this.y += Math.sin(radians) * this.speed;
//         if(this.x < (this.radius/2)){
//             this.x = canvas.width;
//         }
//         if(this.x > canvas.width){
//             this.x = this.radius;
//         }
//         if(this.y < (this.radius/2)){
//             this.y = canvas.height;
//         }
//         if(this.y > canvas.height){
//             this.y = this.radius;
//         }
//     }
//     Draw(){
//         ctx.strokeStyle = this.strokeColor;
//         ctx.beginPath();
//         let vertAngle = ((Math.PI * 2) / 6);
//         var radians = this.angle / Math.PI * 180;
//         for(let i = 0; i < 6; i++){
//             ctx.lineTo(this.x - this.radius * Math.cos(vertAngle * i + radians), this.y - this.radius * Math.sin(vertAngle * i + radians))
//         }
//         ctx.closePath();
//         ctx.stroke();
//     }
// }