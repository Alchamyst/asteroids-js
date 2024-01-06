let canvas;
let context;
let canvasWidth = 1200;
let canvasHeight = 800;
let keys = [];

document.addEventListener('DOMContentLoaded', SetupCanvas);

function SetupCanvas() {
    canvas = document.getElementById('my-canvas');
    context = canvas.getContext('2d');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    context.fillStyle = 'black';
    context.fillRect(0,0,canvasWidth,canvasHeight);

    document.body.addEventListener("keydown", function(e){
        keys[e.keyCode] = true;
    });
    document.body.addEventListener("keyup", function(e){
        keys[e.keyCode] = false;
    });
    Render();
}

class Ship {
    constructor(){
        this.visible = true;
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.movingForward = false;
        this.speed = 0.1;
        this.velocityX = 0;
        this.velocityY = 0;
        this.rotateSpeed = 0.001;
        this.radius = 15;
        this.angle = 0;
        this.strokeColor = 'white';
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
        for(let i = 0; i < 3; i++){
            context.lineTo(this.x - this.radius * Math.cos(vertAngle * i + radians), this.y - this.radius * Math.sin(vertAngle * i + radians))
        }
        context.closePath();
        context.stroke();
    }
}

let ship = new Ship();

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
    ship.Update();
    ship.Draw();
    requestAnimationFrame(Render);
}