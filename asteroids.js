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
let soundManager;
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
    soundManager = new SoundManager;
    document.body.addEventListener("keydown", (e) => {inputManager.KeyDown(e.keyCode)});
    document.body.addEventListener("keyup", (e) => {inputManager.KeyUp(e.keyCode)});

    gameManager.Init();

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
    gameManager.CheckGameState();

    // Loop over all game objects and draw.
    for (let i = 0; i < gameObjects.length; i++) {
        gameObjects[i].Render();
    }

    window.requestAnimationFrame(gameLoop);
}

const detectCollisions = () => {
    let obj1;
    let obj2;

    // Reset collision state for all PhysicsObjects.
    for(let i=0; i < gameObjects.length; i++) {
        if(gameObjects[i] instanceof PhysicsObject){
            gameObjects[i].isColliding = false; 
        }
    }

    // Check Physics objects for Collisions
    for (let i = gameObjects.length -1; i >= 0; i--){
        obj1 = gameObjects[i];

        if (obj1 instanceof PhysicsObject){
            for (let j = gameObjects.length - 1; j >= 0; j--){
                obj2 = gameObjects[j];
                
                if (obj2 instanceof PhysicsObject && i !==j){
                    if(circleIntersect(obj1.x, obj1.y, obj1.collisionRadius, obj2.x, obj2.y, obj2.collisionRadius)){

                        // Don't treat bullets as colliding with ship.
                        if ((obj1 instanceof Bullet || obj2 instanceof Bullet) && (obj1 instanceof Ship || obj2 instanceof Ship)) return;

                        obj1.isColliding = true;
                        obj1.isColliding = true;
                        
                        if ((obj1 instanceof Bullet || obj2 instanceof Bullet) && (obj1 instanceof Asteroid || obj2 instanceof Asteroid)){
                            if(obj1 instanceof Asteroid) {
                                obj2.Remove();
                                obj1.ScoredHit(); 
                            }

                            if(obj2 instanceof Asteroid) {
                                obj1.Remove();
                                obj2.ScoredHit();
                            }
                        }
                    }
                }
            }
        }
    }
}

function circleIntersect(x1, y1, r1, x2, y2, r2){
    // Calculate the distance between the two circles
    let squareDistance = (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);

    // When the distance is smaller or equal to the sum of the two radius, the circles touch or overlap
    return squareDistance <= ((r1 + r2) * (r1 + r2))
}

function removeInstances(itemType){
    for (let i = gameObjects.length - 1; i >= 0; i--) {
        if (gameObjects[i] instanceof itemType) {
            gameObjects.splice(i, 1);
        }
    }   
}

class GameManager {
    constructor(){
        this.gameState = 'START'; // START, RUNNING, PAUSE, GAME_OVER
        this.currentLives = 0;
        this.currentScore = 0;
        this.asteroidCount = 8;
    }
    Init(){
        // Create HUD & Some Asteroids
        // gameObjects.push(new TimersHUD());
        gameObjects.push(new LivesCounter());
        gameObjects.push(new ScoreCounter());
        gameObjects.push(new GameMsg('Asteroids','Press Enter To Start'));
        this.SpawnAsteroids(10);
    }
    CheckGameState(){
        switch(this.gameState) {
            case 'START':
                if(inputManager.actions.startButton){
                    removeInstances(GameMsg);
                    this.NewGame();
                } 
                break; 

            case 'RUNNING':
                break;

            case 'GAME_OVER':
                if(inputManager.actions.startButton){
                    removeInstances(GameMsg);
                    this.NewGame();
                } 
                break;

            default:
                console.log("GameState Error.")
        }
    }
    NewGame(){
        this.gameState = 'RUNNING';
        this.currentLives = 3;
        this.currentScore = 0;
        removeInstances(Asteroid);
        this.SpawnAsteroids(this.asteroidCount);
        gameObjects.push(new Ship());
    }
    GameOver(){
        this.gameState = 'GAME_OVER';
        for(let i=0; i < gameObjects.length; i++) {
            if(gameObjects[i] instanceof Ship){
                gameObjects.splice(i,1);
            }
        }
        soundManager.PlaySound('gameOver');
        gameObjects.push(new GameMsg('GAME OVER','Press Enter To Try Again'));
    }
    ShipDestroyed(){
        this.currentLives -= 1;
        if(this.currentLives <= 0) return this.GameOver();

        for(let i=0; i < gameObjects.length; i++) {
            if(gameObjects[i] instanceof Ship){
                gameObjects.splice(i,1);
            }
        }
        gameObjects.push(new Ship());
    }
    SpawnAsteroids(amount){
        for(let i = 0; i < amount; i++){
            gameObjects.push(new Asteroid());
        }
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

class GameMsg extends HudElement {
    constructor(text1, text2){
        super();
        this.font1 = '50px Arial';
        this.font2 = '20px Arial';
        this.text1 = text1 || 'Foo';
        this.text2 = text2 || 'Bar';
        this.shouldClose = false;
    }
    Update(){

    }
    Render(){
        context.fillStyle = this.color;
        context.font = this.font1;
        context.fillText(this.text1, (canvasWidth - context.measureText(this.text1).width) /2, canvasHeight / 2);
        context.font = this.font2;
        context.fillText(this.text2, (canvasWidth - (context.measureText(this.text2).width)) / 2, (canvasHeight / 2) + 40);
    }
}

class ScoreCounter extends HudElement {
    constructor(){
        super(0, 0);     
        this.score = gameManager.currentScore;
    }
    Update(){
        this.score = gameManager.currentScore;
    }
    Render(){
        context.strokeStyle = this.color;

        // context.clearRect(0,0, canvasWidth, canvasHeight);
        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.fillText('SCORE: ' + this.score.toString(), 20, 35);
    }
}    

// ctx.clearRect(0,0, canvasWidth, canvasHeight);
// ctx.fillStyle = 'white';
// ctx.font = '20px Arial';
// ctx.fillText('SCORE: ' + score.toString(), 20, 35);

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
        this.font = '25px Arial';  
    }
    Render(){
        context.font = this.font;
        context.fillStyle = this.color;
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
        this.renderCollision = false; // Useful for debugging.
        this.isColliding = false; 
    }
    Update(){
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
        this.rotateSpeed = 0.1;
        this.radius = 15;
        // this.collisionRadius = 11;
        this.dirModifier = 0;
        this.angle = 0;
        this.strokeColor = 'white';
        this.noseX = canvasWidth / 2 + 15;
        this.noseY = canvasHeight / 2;
        this.movingForward = false;
        this.wasMovingForward = false;
        this.shieldTimer = 3;

        this.bulletTimer = 0;
        this.bulletFireDelay = 0.2;
    }
    Update(secondsPassed){
        super.Update();


        if(this.isColliding == true && this.shieldTimer == 0){
            gameManager.currentLives -= 1;

            soundManager.PlaySound('shipExplode');
            soundManager.StopSound('shipThrusters');
            
            if(gameManager.currentLives == 0) return gameManager.GameOver();

            this.x = canvasWidth / 2;
            this.y = canvasHeight / 2;
            this.velocityX = 0;
            this.velocityY = 0;
            this.movingForward = false;
            this.dirModifier = 0;
            this.shieldTimer = 3;
            return
        }

        this.bulletTimer += secondsPassed;

        // Check for inputs affecting ship actions.
        this.wasMovingForward = this.movingForward;
        this.movingForward = inputManager.actions.forwardButton;
        this.dirModifier = 0;
        if(inputManager.actions.leftButton) this.dirModifier = -1;
        if(inputManager.actions.rightButton) this.dirModifier = 1;
        if(inputManager.actions.fireButton && this.bulletTimer >= this.bulletFireDelay){
            gameObjects.push(new Bullet(this.noseX, this.noseY, this.angle));
            soundManager.PlaySound('shootBullet');
            this.bulletTimer = 0;
        };

        let radians = this.angle / Math.PI * 180; //convert from degrees to radians.

        // Increase velocity if movingForward.
        if(this.movingForward) {
            this.velocityX += Math.cos(radians) * this.speed;
            this.velocityY += Math.sin(radians) * this.speed;
        }
        // Check if the moving forward state has changes since last update, and update the sounds. 
        if(this.wasMovingForward !== this.movingForward){
            this.movingForward ? soundManager.PlaySound('shipThrusters') : soundManager.StopSound('shipThrusters');
        }

        // Move the ship to the other side of the screen if we move out of bounds.
        if(this.x < this.radius) this.x = canvas.width; 
        if(this.x > canvas.width) this.x = this.radius; 
        if(this.y < this.radius) this.y = canvas.height; 
        if(this.y > canvas.height) this.y = this.radius; 

        // Reduce velocity. Imposes speed cap.
        this.velocityX *= Math.pow(0.5, secondsPassed);
        this.velocityY *= Math.pow(0.5, secondsPassed);
        // this.velocityX *= 0.99;
        // this.velocityY *= 0.99;

        this.angle += (this.rotateSpeed * this.dirModifier) * secondsPassed;
        this.x -= (this.velocityX * secondsPassed);
        this.y -= (this.velocityY * secondsPassed);

        // Reduce the shield timer.
        let previouShieldTimer = this.shieldTimer;
        this.shieldTimer = Math.max(0, this.shieldTimer - secondsPassed);
        if(previouShieldTimer > this.shieldTimer && this.shieldTimer === 0){
            soundManager.PlaySound('shieldDown');
        }
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

        // Shield visual
        if (this.shieldTimer > 0){
            let opacity = this.shieldTimer > 1 ? 0.9 : this.shieldTimer;
            context.beginPath();
            context.strokeStyle = `rgba(0, 255, 255, ${opacity})`;
            context.arc(this.x, this.y, (this.collisionRadius*1.75),0,2* Math.PI);
            context.closePath();
            context.stroke();
        }
    }
}

class Bullet extends PhysicsObject {
    constructor(x, y, angle){
        super(x, y);

        this.angle = angle;
        this.collisionRadius = 3;
        this.height = 4;
        this.width = 4;
        this.speed = 2000;
        this.velocityX = 0;
        this.velocityY = 0;
    }
    Remove(){
        var i = gameObjects.indexOf(this);
        return gameObjects.splice(i,1);
    }
    Update(){
        super.Update();

        var radians = this.angle / Math.PI * 180;
        this.x -= Math.cos(radians) * this.speed * secondsPassed;
        this.y -= Math.sin(radians) * this.speed * secondsPassed;

        if(this.x < -25 || this.y < -25 || this.x > canvas.width +25 || this.y > canvas.height +25){
            this.Remove();
        }
    }
    Render(){
        super.Render();

        context.fillStyle = 'white';
        context.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Asteroid extends PhysicsObject {
    constructor(startX, startY, level, speed){
        super();
        this.x = startX || Math.floor(Math.random() * canvasWidth);
        this.y = startY || Math.floor(Math.random() * canvasHeight);

        this.angle = Math.floor(Math.random() * 328);
        this.strokeColor = 'white';

        this.asteroidSizes = {
            1: 50,
            2: 25,
            3: 15
        }
        this.asteroidCollisions = {
            1: 46,
            2: 22,
            3: 12
        }
        this.asteroidSpeeds = {
            1: 200,
            2: 240,
            3: 275
        }
        this.asteroidScores = {
            1: 5,
            2: 7,
            3: 9
        }
        this.level = level || 1;
        this.speed = this.asteroidSpeeds[level] || 200;
        this.radius = this.asteroidSizes[level] || 50;
        this.collisionRadius = this.asteroidCollisions[level] || 46;
    }
    ScoredHit(){
        gameManager.currentScore += this.asteroidScores[this.level];
        if(this.level === 1 || this.level === 2){
            const spawnLevel = this.level+1;
            gameObjects.push(new Asteroid(this.x - 5, this.y -5, spawnLevel));
            gameObjects.push(new Asteroid(this.x + 5, this.y + 5, spawnLevel));
        }
        var i = gameObjects.indexOf(this);
        return gameObjects.splice(i,1);
    }
    Update(){
        super.Update();
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


class SoundManager {
    constructor(){
        this.isAudioEnabled = true;
        this.sfx = {
            gameOver: new sound("./audio/game-fx-9-40197.mp3", 50),
            shieldDown: new sound("./audio/one_beep-99630.mp3"),
            shipExplode: new sound("./audio/hurt_c_08-102842.mp3", 75),
            shipThrusters: new sound("./audio/thrusters_loopwav-14699.mp3", 50),
            shootBullet: new sound("./audio/shoot02wav-14562.mp3", 15)
        }
    }
    PlaySound(sound){
        if(this.isAudioEnabled){
            this.sfx[sound].play();
        }
    }
    StopSound(sound){
        if(this.isAudioEnabled){
            this.sfx[sound].stop();
        }
    }
    // PlayBulletSound(){
    //     if(this.isAudioEnabled){
    //         this.sfx.shootBullet.play();
    //     }
    // }
}

function sound(src, volPercent = 100) {
    this.sound = new Audio(src);
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);

    this.setVolume = function (volPercent) {
        if (volPercent >= 0 && volPercent <= 100) {
            this.sound.volume = volPercent / 100;
        } else {
            console.error('Invalid volume percentage. Please provide a value between 0 and 100.');
        }
    };

    this.play = function(){
        this.setVolume(volPercent);
        this.sound.play();
    }
    this.stop = function(){
        this.sound.pause();
    }

    
}

// class SoundManager {
//     constructor() {
//         this.isAudioEnabled = true;
//         this.audioContext = null;

//         // Initialize AudioContext when a user gesture occurs
//         document.addEventListener('click', () => {
//             this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
//         }, { once: true });

//         this.sfx = {
//             shootBullet: new Sound(this.audioContext, "./audio/retro-game-shot-152052.mp3")
//         };
//     }

//     PlaySound(sound) {
//         if (this.audioContext) {
//             this.sfx[sound].play();
//         } else {
//             console.error('AudioContext not initialized. Make sure to trigger this action after a user gesture.');
//         }
//     }
// }

// class Sound {
//     constructor(audioContext, src) {
//         this.audioContext = audioContext;
//         this.src = src;
//         this.buffer = null;
//         this.isPlaying = false;

//         this.loadSound();
//     }

//     loadSound() {
//         const request = new XMLHttpRequest();
//         request.open('GET', this.src, true);
//         request.responseType = 'arraybuffer';

//         request.onload = () => {
//             this.audioContext.decodeAudioData(request.response, (buffer) => {
//                 this.buffer = buffer;
//             });
//         };

//         request.send();
//     }

//     play() {
//         if (this.isPlaying) {
//             return;
//         }

//         this.isPlaying = true;
//         const source = this.audioContext.createBufferSource();
//         source.buffer = this.buffer;

//         source.onended = () => {
//             this.isPlaying = false;
//         };

//         source.connect(this.audioContext.destination);
//         source.start(0);
//     }
// }