
const canvasWidth = 1200;
const canvasHeight = 800;
let canvas;
let context;

let secondsPassed = 0;
let oldTimeStamp = 0;
let fps;
let hud;

let gameObjects = [];

document.addEventListener('DOMContentLoaded', init); 

function init(){
    canvas = document.getElementById('my-canvas');
    context = canvas.getContext('2d');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    clearScreen();


    // livesCounter = new LivesCounter(context);
    // timersHUD = new TimersHUD(context);

    gameObjects.push(new TimersHUD(context));
    gameObjects.push(new LivesCounter(context));
    gameObjects.push(new Ship(context));
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

    // Draw number to the screen
    // context.fillStyle = 'white';
    // context.fillRect(0, 0, 200, 100);
    // context.font = '25px Arial';
    // context.fillStyle = 'black';
    // context.fillText("FPS: " + fps, 10, 30);

    clearScreen();
    // livesCounter.Render();
    // timersHUD.Render();

    // Loop over all game objects
    // for (let i = 0; i < gameObjects.length; i++) {
    //     gameObjects[i].update(secondsPassed);
    // }

   

    // Do the same to draw
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



class GameObject {
    constructor(ctx, x, y){
        this.ctx = ctx;
        this.x = x;
        this.y = y;
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

class Ship extends GameObject {
    constructor(ctx){
        super(ctx, canvasWidth / 2 , canvasHeight / 2);
        this.speed = 0.075;
        this.rotateSpeed = 0.00075;
        this.radius = 15;
        this.collisionRadius = 11;
        this.angle = 0;
        this.strokeColor = 'white';
        this.noseX = canvasWidth / 2 + 15;
        this.noseY = canvasHeight / 2;
    }
    Update(){

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