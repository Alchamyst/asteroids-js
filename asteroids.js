let canvas;
let context;
let canvasWidth = 1200;
let canvasHeight = 800;
let ship;
let keys = [];
let bullets = [];
let asteroids = [];
let score = 0;
let lives = 3;

document.addEventListener('DOMContentLoaded', SetupCanvas);

function SetupCanvas() {
    canvas = document.getElementById('my-canvas');
    context = canvas.getContext('2d');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    context.fillStyle = 'black';
    context.fillRect(0,0,canvasWidth,canvasHeight);

    ship = new Ship();

    for(let i = 0; i < 8; i++){
        asteroids.push(new Asteroid());
    }

    document.body.addEventListener("keydown", function(e){
        keys[e.keyCode] = true;
    });
    document.body.addEventListener("keyup", function(e){
        keys[e.keyCode] = false;
        if(e.keyCode === 32){
            bullets.push(new Bullet(ship.angle));
        }
    });
    Render();
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
        this.rotateSpeed = 0.001;
        this.radius = 15;
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
        this.speed = 7.5;
        this.velocityX = 0;
        this.velocityY = 0;
    }
    Update(){
        var radians = this.angle / Math.PI * 180;
        this.x -= Math.cos(radians) * this.speed;
        this.y -= Math.sin(radians) * this.speed;
    }
    Draw(){
        context.fillStyle = 'white';
        context.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Asteroid {
    constructor(x,y,radius, level,collisionRadius){
        this.visible = true;
        this.x = x || Math.floor(Math.random() * canvasWidth);
        this.y = y || Math.floor(Math.random() * canvasHeight);
        this.speed = 2;
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

function CircleCollision(p1x, p1y, r1, p2x, p2y, r2){
    let radiusSum;
    let xDiff;
    let yDiff;
    radiusSum = r1 + r2;
    xDiff = p1x - p2x;
    yDiff = p1y - p2y;
    if(radiusSum > Math.sqrt((xDiff * yDiff) + (yDiff + yDiff))){
        return true;
    }
    return false;
}

function DrawLifeShips(){
    let startX = 1175;
    let startY = 10;
    let points = [[9,9],[-9,9]];
    context.strokeStyle = 'white';
    for(let i = 0; i < lives; i++){
        context.beginPath();
        context.moveTo(startX, startY);
        for(let j = 0; j < points.length; j++){
            context.lineTo(startX + points[j][0], startY + points[j][1]);
        }
        context.closePath();
        context.stroke();
        startX -= 30;
    }
}

function Render(){
    //keys: 87=w, 68=d, 65=a
    ship.movingForward = (keys[87]); 
    if(keys[68]){
        ship.Rotate(1);
    }
    if(keys[65]){
        ship.Rotate(-1);
    }
    context.clearRect(0,0, canvasWidth, canvasHeight);
    context.fillStyle = 'white';
    context.font = '20px Arial';
    context.fillText('SCORE: ' + score.toString(), 20, 35);
    if(lives <= 0 ){
        ship.visible = false;
        context.fillStyle = 'white';
        context.font = '50px Arial';
        context.fillText('GAME OVER', canvasWidth / 2 - 150, canvasHeight / 2);
    }
    DrawLifeShips();



    ship.Update();
    ship.Draw();
    if(bullets.length !==0){
        for(let i = 0; i < bullets.length; i++){
            bullets[i].Update();
            bullets[i].Draw();
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