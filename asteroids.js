
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
    
    gameObjects.push(new TimersHUD(context));
    gameObjects.push(new LivesCounter(context));
    gameObjects.push(new Ship(context));

    // document.body.addEventListener("keydown", function(e){
    //     keys[e.keyCode] = true;
    // });
    // document.body.addEventListener("keyup", function(e){
    //     keys[e.keyCode] = false;
    //     if(e.keyCode === 32 && ship.visible){
    //         bullets.push(new Bullet(ship.angle));
    //     }
    // });
    // let Player = new Ship(context, canvasWidth / 2, canvasHeight / 2, 0, 0, collisionRadius);

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

    // Loop over all game objects and draw.
    for (let i = 0; i < gameObjects.length; i++) {
        gameObjects[i].Render();
    }

    window.requestAnimationFrame(gameLoop);
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
        console.log(`keyCode=${keyCode}`)
        if(keyCode === 38 || keyCode == 87){this.actions.forwardButton = true; console.log("forwardButton down")}
        

        // LeftArrow or A key pressed.
        if(keyCode === 37 || keyCode == 65){this.actions.leftButton = true}

        // RightArrow or D key pressed.
        if(keyCode === 39 || keyCode == 68){this.actions.rightButton = true}

        // Spacebar key pressed.
        if(keyCode === 32){this.actions.fireButton = true}

        // Enter key pressed.
        if(keyCode === 13){this.actions.startButton = true}
    }
    KeyUp(keyCode){
        // UpArrow or W key pressed.
        if(keyCode === 38 || keyCode === 87){this.actions.forwardButton = false; console.log("forwardButton up")}

        // LeftArrow or A key pressed.
        if(keyCode === 37 || keyCode === 65){this.actions.leftButton = false}

        // RightArrow or D key pressed.
        if(keyCode === 39 || keyCode === 68){this.actions.rightButton = false}

        // Spacebar key pressed.
        if(keyCode === 32){this.actions.fireButton = false}

        // Enter key pressed.
        if(keyCode === 13){this.actions.startButton = false}
    }
}

class GameObject {
    constructor(ctx, x, y){
        this.ctx = ctx;
        this.x = x;
        this.y = y;
    }
    Update(){

    }
    Render(){

    }
}

class HudElement extends GameObject {
    constructor(ctx, startX, startY){
        super(ctx, startX, startY);
        this.color = 'white';
    }
}

class LivesCounter extends HudElement {
    constructor(ctx){
        super(ctx, 1175, 10);     
        this.lives = 3;
    }
    Render(){
        let points = [[9,9],[-9,9]];
        let renderX = this.x 
        this.ctx.strokeStyle = this.color;

        for(let i = 0; i < this.lives; i++){
            this.ctx.beginPath();
            this.ctx.moveTo(renderX, this.y);
            for(let j = 0; j < points.length; j++){
                this.ctx.lineTo(renderX + points[j][0], this.y + points[j][1]);
            }
            this.ctx.closePath();
            this.ctx.stroke();
            renderX -= 30;
        }
    }
}

class TimersHUD extends HudElement {
    constructor(ctx){
        super(ctx, canvasWidth-125, canvasHeight-25);     
    }
    Render(){
        // this.ctx.fillStyle = 'white';
        // this.ctx.fillRect(this.x, this.y, 200, 100);
        this.ctx.font = '25px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText("FPS: " + fps, this.x, this.y);
        // this.ctx.fillText("SP: " + secondsPassed, this.x-50, this.y-40);      
    }
}

class PhysicsObject extends GameObject {
    constructor(context, x, y, velocityX, velocityY, collisionRadius){
        super(context, x, y);
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.collisionRadius = collisionRadius;
        this.isColliding = false;
    }
}

class Ship extends PhysicsObject {
    constructor(ctx){
        super(ctx, canvasWidth / 2 , canvasHeight / 2, 0, 0, 11);
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
        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.beginPath();
        let vertAngle = ((Math.PI * 2) /3);
        let radians = this.angle / Math.PI * 180;
        this.noseX = this.x - this.radius * Math.cos(radians);
        this.noseY = this.y - this.radius * Math.sin(radians);
        for(let i = 0; i < 3; i++){
            this.ctx.lineTo(this.x - this.radius * Math.cos(vertAngle * i + radians), this.y - this.radius * Math.sin(vertAngle * i + radians))
        }
        this.ctx.closePath();
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.strokeStyle = 'green';
        this.ctx.arc(this.noseX, this.noseY, 2,0,2* Math.PI);
        // ctx.rect(this.noseX, this.noseX, 1, 2);
        this.ctx.closePath();
        this.ctx.stroke();
    }
}