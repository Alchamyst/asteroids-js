let canvas;
let ctx;
let canvasWidth = 1200;
let canvasHeight = 800;
let ship;

let keys = [];
let bullets = [];
let asteroids = [];
let score = 0;
let lives = 3;

// let coordinator;
// let gameManager;
// let screen;

document.addEventListener('DOMContentLoaded', SetupCanvas); //to be changed to LoadGame

// function LoadGame(){
//     coordinator =  new Coordinator();
//     gameManager = new GameManager(); 
//     screen = new Screen();
// }

function SetupCanvas() {
    canvas = document.getElementById('my-canvas');
    ctx = canvas.getContext('2d');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,canvasWidth,canvasHeight);  

    ship = new Ship();

    for(let i = 0; i < 7; i++){
        asteroids.push(new Asteroid());
    }

    document.body.addEventListener("keydown", function(e){
        keys[e.keyCode] = true;
    });
    document.body.addEventListener("keyup", function(e){
        keys[e.keyCode] = false;
        if(e.keyCode === 32 && ship.visible){
            bullets.push(new Bullet(ship.angle));
        }
    });
    Render();
}

class Coordinator {
    // Create Canvas
    // Create GameManager
    // Listens for events from Canvas and GameManager, coordinator can decide what to do (call Canvas to render where relevant)
}

class GameManager {
    constructor(){
        this.gameState = 'START'; // START, RUNNING, PAUSE, GAME_OVER
    }
    NewGame(){
        this.gameState = 'RUNNING';
    }
    PauseGame(){
        this.gameState = 'PAUSED';
    }
    GameOver(){
        this.gameState = 'GAME_OVER';
    }
}

class Screen {
    SetupCanvas(){

    }
}

class InputManager {
    constructor() {
        // this.keys = []; 
    }
    // events to be fire for keys: A,W,D,SpaceBar, Enter, ArrowLeft, ArrowUp, ArrowDown
    // Esc to pause game
    // Enter to start new game (when on GAME_OVER or START screens.)
}

class Ship {
    constructor(){
        this.visible = true;
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.movingForward = false;
        this.speed = 0.075;
        this.velocityX = 0;
        this.velocityY = 0;
        this.rotateSpeed = 0.00075;
        this.radius = 15;
        this.collisionRadius = 11;
        this.angle = 0;
        this.strokeColor = 'white';
        this.noseX = canvasWidth / 2 + 15;
        this.noseY = canvasHeight / 2;
    }
    Rotate(dir){
        this.angle += this.rotateSpeed * dir;
    }
    Update(){
        let radians = this.angle / Math.PI * 180; //convert from degrees to radians.
        // oldX + cos(radians) * distance
        // oldY + sin(radians) * distance

        if(this.movingForward) {
            this.velocityX += Math.cos(radians) * this.speed;
            this.velocityY += Math.sin(radians) * this.speed;
        }
        if(this.x < this.radius){
            this.x = canvas.width;
        }
        if(this.x > canvas.width){
            this.x = this.radius;
        }
        if(this.y < this.radius){
            this.y = canvas.height;
        }
        if(this.y > canvas.height){
            this.y = this.radius;
        }
        this.velocityX *= 0.99;
        this.velocityY *= 0.99;

        this.x -= this.velocityX;
        this.y -= this.velocityY;
    }
    Draw(){
        ctx.strokeStyle = this.strokeColor;
        ctx.beginPath();
        let vertAngle = ((Math.PI * 2) /3);
        let radians = this.angle / Math.PI * 180;
        this.noseX = this.x - this.radius * Math.cos(radians);
        this.noseY = this.y - this.radius * Math.sin(radians);
        for(let i = 0; i < 3; i++){
            ctx.lineTo(this.x - this.radius * Math.cos(vertAngle * i + radians), this.y - this.radius * Math.sin(vertAngle * i + radians))
        }
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.arc(this.noseX, this.noseY, 2,0,2* Math.PI);
        // ctx.rect(this.noseX, this.noseX, 1, 2);
        ctx.closePath();
        ctx.stroke();

        // Collision rendering for debug.
        // ctx.beginPath();
        // ctx.strokeStyle = 'green';
        // ctx.arc(this.x, this.y, this.collisionRadius,0,2* Math.PI);
        // ctx.closePath();
        // ctx.stroke();
    }
}


class Bullet {
    constructor(angle){
        this.visible = true;
        this.x = ship.noseX;
        this.y = ship.noseY;
        this.angle = angle;
        this.height = 4;
        this.width = 4;
        this.collisionRadius = 3;
        this.speed = 7;
        this.velocityX = 0;
        this.velocityY = 0;
    }
    Update(){
        var radians = this.angle / Math.PI * 180;
        this.x -= Math.cos(radians) * this.speed;
        this.y -= Math.sin(radians) * this.speed;
    }
    Draw(){
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    CleanUp(){
        if(this.x < -25 || this.y < -25 || this.x > canvas.width +25 || this.y > canvas.height +25){
            var i = bullets.indexOf(this);
            return bullets.splice(i,1);
        }
    }
}

class Asteroid {
    constructor(x,y,radius, level,collisionRadius){
        this.visible = true;
        this.x = x || Math.floor(Math.random() * canvasWidth);
        this.y = y || Math.floor(Math.random() * canvasHeight);
        this.speed = 1.25;
        // this.speed = 0;
        this.radius = radius || 50;
        this.angle = Math.floor(Math.random() * 359);
        this.strokeColor = 'white';
        this.collisionRadius = collisionRadius || 46;
        this.level = level || 1;
    }
    Update(){
        var radians = this.angle / Math.PI * 180;
        this.x += Math.cos(radians) * this.speed;
        this.y += Math.sin(radians) * this.speed;
        if(this.x < (this.radius/2)){
            this.x = canvas.width;
        }
        if(this.x > canvas.width){
            this.x = this.radius;
        }
        if(this.y < (this.radius/2)){
            this.y = canvas.height;
        }
        if(this.y > canvas.height){
            this.y = this.radius;
        }
    }
    Draw(){
        ctx.strokeStyle = this.strokeColor;
        ctx.beginPath();
        let vertAngle = ((Math.PI * 2) / 6);
        var radians = this.angle / Math.PI * 180;
        for(let i = 0; i < 6; i++){
            ctx.lineTo(this.x - this.radius * Math.cos(vertAngle * i + radians), this.y - this.radius * Math.sin(vertAngle * i + radians))
        }
        ctx.closePath();
        ctx.stroke();

        //Collision rendering for debug.
        // ctx.beginPath();
        // ctx.strokeStyle = 'yellow';
        // ctx.arc(this.x, this.y, this.collisionRadius,0,2* Math.PI);
        // ctx.closePath();
        // ctx.stroke();
    }
}

function CircleCollision(p1x, p1y, r1, p2x, p2y, r2){
    let radiusSum;
    let xDiff;
    let yDiff;
    radiusSum = r1 + r2;
    xDiff = p1x - p2x;
    yDiff = p1y - p2y;
    if(radiusSum > Math.sqrt((xDiff * xDiff) + (yDiff * yDiff))){
        return true;
    }
    return false;
}

function DrawLifeShips(){
    let startX = 1175;
    let startY = 10;
    let points = [[9,9],[-9,9]];
    ctx.strokeStyle = 'white';
    for(let i = 0; i < lives; i++){
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for(let j = 0; j < points.length; j++){
            ctx.lineTo(startX + points[j][0], startY + points[j][1]);
        }
        ctx.closePath();
        ctx.stroke();
        startX -= 30;
    }
}

function Render(){
    //keys: 87=w, 68=d, 65=a, arrows: left=37, up=38, right=39
    ship.movingForward = (keys[87] || keys[38]); 
    if(keys[68] || keys[39]){
        ship.Rotate(1);
    }
    if(keys[65] || keys[37]){
        ship.Rotate(-1);
    }
    ctx.clearRect(0,0, canvasWidth, canvasHeight);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('SCORE: ' + score.toString(), 20, 35);
    if(lives <= 0 ){
        ship.visible = false;
        ctx.fillStyle = 'white';
        ctx.font = '50px Arial';
        ctx.fillText('GAME OVER', canvasWidth / 2 - 150, canvasHeight / 2);
        // ctx.font = '20px Arial';
        // ctx.fillText('Press Enter To Try Again', canvasWidth / 2 - 108, (canvasHeight / 2) + 40);
    }
    DrawLifeShips();

    if(asteroids.length !== 0){
        for(let i = 0; i < asteroids.length; i++){
            if(CircleCollision(ship.x, ship.y, ship.collisionRadius, asteroids[i].x, asteroids[i].y, asteroids[i].collisionRadius)){
                ship.x = canvasWidth / 2;
                ship.y = canvasHeight / 2;
                ship.velocityX = 0;
                ship.velocityY = 0;
                lives -= 1;
            }
        }
    }

    if(asteroids.length !== 0 && bullets.length !== 0){

        for(let i = 0; i < asteroids.length; i++){
        loop1:
            for(let j = 0; j < bullets.length; j++){

                let bulletsToClean =[];

                if(CircleCollision(bullets[j].x, bullets[j].y, bullets[j].collisionRadius, asteroids[i].x, asteroids[i].y, asteroids[i].collisionRadius)){
                    if(asteroids[i].level === 1){
                        asteroids.push(new Asteroid(asteroids[i].x - 5, asteroids[i].y -5, 25, 2, 22));
                        asteroids.push(new Asteroid(asteroids[i].x + 5, asteroids[i].y + 5, 25, 2, 22));
                        score += 5;
                    } else if (asteroids[i].level === 2){
                        asteroids.push(new Asteroid(asteroids[i].x - 5, asteroids[i].y -5, 15, 3, 12));
                        asteroids.push(new Asteroid(asteroids[i].x + 5, asteroids[i].y + 5, 15, 3, 12));
                        score += 7;
                    } else if (asteroids[i].level === 3){
                        score += 9;
                    }
                    asteroids.splice(i,1);
                    bulletsToClean.push(i)
                    bullets.splice(j,1);
                }
            }
        }
    }

    if(ship.visible){
        ship.Update();
        ship.Draw();
    }

    if(bullets.length !==0){
        for(let i = 0; i < bullets.length; i++){
            bullets[i].Update();
            bullets[i].Draw();
            bullets[i].CleanUp();
        }
    }
    if(asteroids.length !==0){
        for(let i = 0; i < asteroids.length; i++){
            asteroids[i].Update();
            asteroids[i].Draw();
        }
    }
    requestAnimationFrame(Render);
}