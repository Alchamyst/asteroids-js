// debug settings
const debugHud = false;
const debugShields = false;
const easyLevels = false;
const renderCollision = false;

const canvasWidth = 1200;
const canvasHeight = 800;
let canvas;
let context;

let secondsPassed = 0;
let oldTimeStamp = 0;
let fps;

let audioManager;
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
    audioManager = new AudioManager;
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
                        obj2.isColliding = true;
                        
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
    gameObjects = gameObjects.filter(item => !(item instanceof itemType)); 
}

class GameManager {
    constructor(){
        this.gameState = 'START';
        this.currentLevel = 1;
        this.currentLives = 0;
        this.currentScore = 0;
        this.currentAsteroids = 0;
        this.bonusLivesScore = 25;
        this.isSoundEnabled = true;
        this.gameOverSound = '';
        this.missionCompleteSound = '';
                this.levelData = {
            1: { bigAsteroids: 6, mediumAsteroids: 0, smallAsteroids: 0 },
            2: { bigAsteroids: 7, mediumAsteroids: 2, smallAsteroids: 0 },
            3: { bigAsteroids: 8, mediumAsteroids: 4, smallAsteroids: 3 },
            4: { bigAsteroids: 9, mediumAsteroids: 6, smallAsteroids: 6 },
            5: { bigAsteroids: 10, mediumAsteroids: 8, smallAsteroids: 9 }
        }
        if (easyLevels){
            this.levelData = {
                1: { bigAsteroids: 1, mediumAsteroids: 1, smallAsteroids: 1 },
                2: { bigAsteroids: 1, mediumAsteroids: 1, smallAsteroids: 2 }
            }
        }

        this.player = undefined;
        this.playerRespawnTime = 2;
    }
    Init(){
        // Create HUD & Some Asteroids
        if(debugHud) gameObjects.push(new DebugHUD());
        gameObjects.push(new LivesCounter());
        gameObjects.push(new ScoreCounter());
        gameObjects.push(new GameMsg('Asteroids','Press Enter To Start'));
        this.gameOverSound = audioManager.CreateSound('gameOver'); // Must be initialised outside of contructor due to reliance on gameManager.isSoundEnabled within the SoundManager.
        this.missionCompleteSound = audioManager.CreateSound('missionComplete'); 
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

            case 'LEVEL_SETUP':
                break;

            case 'LEVEL_RUNNING':
                this.TrackAsteroids();
                if(this.currentAsteroids == 0){
                    if(this.currentLevel == Object.keys(this.levelData).length){
                        return this.GameOver();
                    }
                    this.LevelComplete();
                }
                break;

            case 'LEVEL_COMPLETE':
                if(inputManager.actions.startButton){
                    removeInstances(GameMsg);
                    this.NextLevel();
                } 
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
        this.gameState = 'LEVEL_SETUP';
        this.currentLevel = 1;
        this.currentScore = 0;
        this.LevelSetup();
    }
    LevelComplete(){
        this.gameState = 'LEVEL_COMPLETE'; 
        this.player.CleanUpEffects(); 
        removeInstances(Ship);
        this.AddScore(this.currentLives * this.bonusLivesScore);
        gameObjects.push(new GameMsg(`LEVEL ${this.currentLevel} COMPLETE`,'Press Enter To Continue.'));
    }
    NextLevel(){
        this.gameState = 'LEVEL_SETUP';  
        this.currentLevel += 1;
        this.LevelSetup();
    }
    GameOver(){
        this.player.CleanUpEffects(); 
        removeInstances(Ship);
        if(this.currentLevel == Object.keys(this.levelData).length){
            this.gameState = 'GAME_OVER';
            this.missionCompleteSound.Play();
            return gameObjects.push(new GameMsg('MISSION COMPLETE','Press Enter To Play Again', 'lime'));
        }
        this.gameState = 'GAME_OVER';
        gameObjects.push(new GameMsg('GAME OVER','Press Enter To Try Again', 'red'));
        this.gameOverSound.Play();
    }
    AddScore(points){
        this.currentScore += points; 
    }
    ShipDestroyed(){
        this.currentLives -= 1;
        if(this.currentLives <= 0) return this.GameOver();

        removeInstances(Ship);
        this.NewShip();
    }
    LevelSetup(){
        removeInstances(Asteroid);
        removeInstances(Ship);

        this.currentLives = 3;
        this.currentAsteroids = 0;

        this.SpawnAsteroids(this.levelData[this.currentLevel].bigAsteroids, 1);
        this.SpawnAsteroids(this.levelData[this.currentLevel].mediumAsteroids, 2);
        this.SpawnAsteroids(this.levelData[this.currentLevel].smallAsteroids, 3);

        this.NewShip(0);

        this.gameState = 'LEVEL_RUNNING'; 
    }
    SpawnAsteroids(amount, level = 1){
        for(let i = 0; i < amount; i++){
            gameObjects.push(new Asteroid(level));
        }  
    }
    TrackAsteroids(){
        let asteroidCount = 0;
        for(let i=0; i < gameObjects.length; i++) {
            if(gameObjects[i] instanceof Asteroid){
                asteroidCount += 1; 
            }
        }
        this.currentAsteroids = asteroidCount;

    }
    NewShip(respawn = this.playerRespawnTime){
        this.player = new Ship(respawn);
        gameObjects.push(this.player);
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
        if(keyCode === 38 || keyCode == 87) this.actions.forwardButton = true; // UpArrow or W key pressed.
        if(keyCode === 37 || keyCode == 65) this.actions.leftButton = true; // LeftArrow or A key pressed.
        if(keyCode === 39 || keyCode == 68) this.actions.rightButton = true; // RightArrow or D key pressed.
        if(keyCode === 32) this.actions.fireButton = true; // Spacebar key pressed.
        if(keyCode === 13) this.actions.startButton = true; // Enter key pressed.
    }
    KeyUp(keyCode){
        if(keyCode === 38 || keyCode === 87) this.actions.forwardButton = false; // UpArrow or W key pressed.
        if(keyCode === 37 || keyCode === 65) this.actions.leftButton = false; // LeftArrow or A key pressed.   
        if(keyCode === 39 || keyCode === 68) this.actions.rightButton = false; // RightArrow or D key pressed.
        if(keyCode === 32) this.actions.fireButton = false; // Spacebar key pressed.
        if(keyCode === 13) this.actions.startButton = false; // Enter key pressed.
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
    constructor(text1, text2, textColor1 = 'white', textColor2 = 'white'){
        super();
        this.font1 = '50px Arial';
        this.font2 = '20px Arial';
        this.text1 = text1 || 'Foo';
        this.text2 = text2 || 'Bar';
        this.text1Color = textColor1;
        this.text2Color = textColor2;
        this.shouldClose = false;
    }
    Update(){
    }
    Render(){
        context.fillStyle = this.text1Color;
        context.font = this.font1;
        context.fillText(this.text1, (canvasWidth - context.measureText(this.text1).width) /2, canvasHeight / 2);
        context.fillStyle = this.text2Color;
        context.font = this.font2;
        context.fillText(this.text2, (canvasWidth - (context.measureText(this.text2).width)) / 2, (canvasHeight / 2) + 40);
    }
}

class DebugHUD extends HudElement {
    constructor(){
        super(canvasWidth-10, canvasHeight-10); 
        this.font = '25px Arial';  
        this.fpsOutput = "FPS: ";
        this.gameState = "GameState: " + gameManager.gameState;
        this.asteroidsOutput = "Asteroids: " + gameManager.currentAsteroids;
    }
    Update(){
        this.gameState = "GameState: " + gameManager.gameState;
        this.asteroidsOutput = "Asteroids: " + gameManager.currentAsteroids;
        this.fpsOutput = "FPS: " + fps;
    }
    Render(){
        context.font = this.font;
        context.fillStyle = this.color;
        context.fillText(this.gameState, this.x - context.measureText(this.gameState).width, this.y); 
        context.fillText(this.asteroidsOutput, this.x - context.measureText(this.asteroidsOutput).width, this.y - 30);    
        context.fillText(this.fpsOutput, this.x - context.measureText(this.fpsOutput).width, this.y -60);
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
        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.fillText('SCORE: ' + this.score.toString(), 20, 35);
    }
}    

class LivesCounter extends HudElement {
    constructor(){
        super(1175, 10);     
        this.lives = gameManager.currentLives;
        this.color = 'lime';
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

class PhysicsObject extends GameObject {
    constructor(x, y, velocityX, velocityY, collisionRadius){
        super(x, y);
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.collisionRadius = collisionRadius;
        this.renderCollision = renderCollision || false; // Useful for debugging.
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
    constructor(respawnTimer = 0){
        const x = canvasWidth / 2;
        const y = canvasHeight / 2
        const velocityX = 0;
        const velocityY = 0;
        const collisionRadius = 11;

        super(x, y, velocityX, velocityY, collisionRadius);

        this.radius = 15;
        this.speed = 10;
        this.rotateSpeed = 0.1;
        this.shieldTimer = 2;
        this.bulletTimer = 0;
        this.bulletFireDelay = 0.2;

        this.shieldSoundEffect = audioManager.CreateSound('shieldDown');
        this.shipExplodeSoundEffect = audioManager.CreateSound('shipExplode');
        this.shipRespawnSoundEffect = audioManager.CreateSound('shipRespawn');
        this.thrusterSoundEffect = audioManager.CreateSound('shipThrusters', true);

        this.strokeColor = 'white';

        this.noseX = x + 15;
        this.noseY = y;
        this.angle = Math.random();
        this.dirModifier = 0;
        this.respawnTimer = respawnTimer;
        this.movingForward = false;
        this.wasMovingForward = false;

        this.jetX = this.x;
        this.jetY = this.y;
        this.jetEmitter = new JetEmitter(this.jetX, this.jetY, this.jetAngle);
        gameObjects.push(this.jetEmitter);
    }
    Update(secondsPassed){
        this.respawnTimer = Math.max(0, this.respawnTimer - secondsPassed); // Tick respawn timer.
        if(this.respawnTimer > 0) return; // Do not run updates if waiting to respawn.

        if(!this.hasRespawned){
            this.shipRespawnSoundEffect.Play();
            this.hasRespawned = true;
        }

        super.Update();

        if(debugShields) this.shieldTimer = 5;

        // If the shield is down, take has hit something and doesn't have a shield up
        if(this.isColliding == true && this.shieldTimer == 0){
            return this.ShipWasHit();
        }

        // Tick bullet fire delay timer.
        this.bulletTimer += secondsPassed;

        // Check for inputs affecting ship actions.
        this.wasMovingForward = this.movingForward;
        this.movingForward = inputManager.actions.forwardButton;
        this.dirModifier = 0;
        if(inputManager.actions.leftButton) this.dirModifier = -1;
        if(inputManager.actions.rightButton) this.dirModifier = 1;
        if(inputManager.actions.fireButton && this.bulletTimer >= this.bulletFireDelay){
            gameObjects.push(new Bullet(this.noseX, this.noseY, this.angle));
            this.bulletTimer = 0;
        };

        let radians = this.angle / Math.PI * 180; //convert from degrees to radians.

        // Increase velocity if movingForward.
        if(this.movingForward) {
            this.velocityX += Math.cos(radians) * this.speed;
            this.velocityY += Math.sin(radians) * this.speed;
        }
        // Check if the moving forward state has changes since last update, and update sounds + particles. 
        if(this.wasMovingForward !== this.movingForward){
            if(this.movingForward){
                this.thrusterSoundEffect.Play('shipThrusters');
                this.jetEmitter.StartEmitting();
            } 
            if(!this.movingForward){
                this.thrusterSoundEffect.Stop('shipThrusters');
                this.jetEmitter.StopEmitting()
            }
        }

        // Move the ship to the other side of the screen if we move out of bounds.
        if(this.x < this.radius) this.x = canvas.width; 
        if(this.x > canvas.width) this.x = this.radius; 
        if(this.y < this.radius) this.y = canvas.height; 
        if(this.y > canvas.height) this.y = this.radius; 

        // Reduce velocity. Imposes speed cap.
        this.velocityX *= Math.pow(0.5, secondsPassed);
        this.velocityY *= Math.pow(0.5, secondsPassed);

        // Update rotation over time.
        this.angle += (this.rotateSpeed * this.dirModifier) * secondsPassed;
        this.x -= (this.velocityX * secondsPassed);
        this.y -= (this.velocityY * secondsPassed);

        // Update jetEmitter location.
        this.jetX = this.x + this.radius/2 * Math.cos(radians);
        this.jetY = this.y + this.radius/2 * Math.sin(radians);
        this.jetEmitter.SetLocation(this.jetX, this.jetY, this.velocityX, this.velocityY);

        // Reduce the shield timer.
        let previouShieldTimer = this.shieldTimer;
        this.shieldTimer = Math.max(0, this.shieldTimer - secondsPassed);
        if(previouShieldTimer > this.shieldTimer && this.shieldTimer === 0){
            this.shieldSoundEffect.Play();
        }
    }
    Render(){
        if(this.respawnTimer > 0) return; // Do not render if waiting to respawn.
    
        super.Render();

        let vertAngle = ((Math.PI * 2) /3);
        let radians = this.angle / Math.PI * 180;

        // Render the main ship triangle.
        context.strokeStyle = this.strokeColor;
        context.beginPath();
        for(let i = 0; i < 3; i++){
            context.lineTo(this.x - this.radius * Math.cos(vertAngle * i + radians), this.y - this.radius * Math.sin(vertAngle * i + radians))
        }
        context.closePath();
        context.stroke();

        // Render front nose marker. 
        this.noseX = this.x - this.radius * Math.cos(radians);
        this.noseY = this.y - this.radius * Math.sin(radians);
        context.strokeStyle = 'red';
        context.beginPath();
        context.arc(this.noseX, this.noseY, 1.5,0,2* Math.PI);
        context.closePath();
        context.stroke();

        // Render shield visual.
        if (this.shieldTimer > 0){
            let opacity = this.shieldTimer > 1 ? 0.9 : this.shieldTimer;
            context.beginPath();
            context.strokeStyle = `rgba(0, 255, 255, ${opacity})`;
            context.arc(this.x, this.y, (this.collisionRadius*1.75),0,2* Math.PI);
            context.closePath();
            context.stroke();
        }
    }
    ShipWasHit(){
        this.shipExplodeSoundEffect.Play();
        // this.thrusterSoundEffect.Stop();
        gameObjects.push(new ShipExplosion(this.x, this.y));
        this.CleanUpEffects();
        // audioManager.CleanUp(this.shipExplodeSoundEffect);
        // audioManager.CleanUp(this.thrusterSoundEffect);
        // this.jetEmitter.Destroy();
        gameManager.ShipDestroyed();
    }
    CleanUpEffects(){
        this.thrusterSoundEffect.Stop();
        audioManager.CleanUp(this.shipExplodeSoundEffect);
        audioManager.CleanUp(this.thrusterSoundEffect);
        this.jetEmitter.Destroy();
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
        this.bulletSoundEffect = audioManager.CreateSound('shootBullet');
        this.soundPlayed = false;    
    }
    Remove(){
        audioManager.CleanUp(this.bulletSoundEffect);
        var i = gameObjects.indexOf(this);
        return gameObjects.splice(i,1);
    }
    Update(){
        super.Update();

        if(!this.soundPlayed){
            this.bulletSoundEffect.Play();
            this.soundPlayed = true;
        }
        var radians = this.angle / Math.PI * 180;
        this.x -= Math.cos(radians) * this.speed * secondsPassed;
        this.y -= Math.sin(radians) * this.speed * secondsPassed;

        if(this.x < -25 || this.y < -25 || this.x > canvas.width +25 || this.y > canvas.height +25){
            this.Remove();
        }
    }
    Render(){
        super.Render();

        context.fillStyle = 'pink';
        context.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Asteroid extends PhysicsObject {
    constructor(level = 1, startX, startY){
        super();

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
        this.asteroidRotationSpeeds = {
            1: Math.random() * 2.75,
            2: Math.random() * 3.25,
            3: Math.random() * 3.75
        }

        this.x = startX || Math.floor(Math.random() * canvasWidth);
        this.y = startY || Math.floor(Math.random() * canvasHeight);

        this.angle = Math.floor(Math.random() * 328);
        this.strokeColor = 'rgb(180,138,113)';

        this.renderRotation = 0;

        this.ShotSoundEffect = audioManager.CreateSound('asteroidExplode');

        this.level = level || 1;
        this.speed = this.asteroidSpeeds[level] || 200;
        this.renderRotationSpeed = this.asteroidRotationSpeeds[level];
        this.radius = this.asteroidSizes[level] || 50;
        this.collisionRadius = this.asteroidCollisions[level] || 46;
    }
    ScoredHit(){
        this.ShotSoundEffect.Play();
        gameManager.AddScore(this.asteroidScores[this.level]);
        // gameManager.TrackAsteroids(-1)
        gameObjects.push(new Explosion(this.x, this.y, 10, 2, ['brown'], 1));
        if(this.level === 1 || this.level === 2){
            const spawnLevel = this.level+1;
            gameObjects.push(new Asteroid(spawnLevel, this.x - 5, this.y -5));
            gameObjects.push(new Asteroid(spawnLevel, this.x + 5, this.y + 5));
            // gameManager.TrackAsteroids(2)
        }
        audioManager.CleanUp(this.ShotSoundEffect);
        var i = gameObjects.indexOf(this);
        return gameObjects.splice(i,1);
    }
    Update(){
        super.Update();

        // Update the rendering rotation over time.
        this.renderRotation += this.renderRotationSpeed * secondsPassed;

        // Update asteroid location over time.
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
        
        // Apply rendering rotation to the asteroid's veritces.
        var radians = this.angle / Math.PI * 180 + this.renderRotation;
        for(let i = 0; i < 6; i++){
            context.lineTo(this.x - this.radius * Math.cos(vertAngle * i + radians), this.y - this.radius * Math.sin(vertAngle * i + radians))
        }
        context.closePath();
        context.stroke();
    }
}

class AudioManager {
    constructor(){
        this.audioPlayers = [];
        this.isAudioEnabled = gameManager.isSoundEnabled;
    }
    ToggleAudioEnabled(enabled = this.isAudioEnabled ? false : true){
        this.isAudioEnabled = enabled;
    }
    CreateSound(soundEffect, loop = false){
        const newSound = new Sound(soundEffect, loop);
        this.audioPlayers.push(newSound);
        return newSound;
    } 
    CleanUp(soundInstance){
        if (soundInstance instanceof Sound) {
            soundInstance.Remove();

            const i = this.audioPlayers.indexOf(soundInstance);
            if (i !== -1) {
                this.audioPlayers.splice(i, 1);
            }
        } else console.log("CleanUp Failed: Not an instanceof Sound.")
    }
}

class Sound {
    constructor(soundEffect, loop = false) {
        const sfx = {
            asteroidExplode: { soundFile: "./audio/space-explosion-with-reverb-101449.mp3", volPercent: 40},
            gameOver: { soundFile: "./audio/game-fx-9-40197.mp3", volPercent: 50},
            missionComplete: { soundFile: "./audio/game-level-complete-143022.mp3", volPercent: 50},
            shieldDown: { soundFile: "./audio/one_beep-99630.mp3", volPercent: 100},
            shipExplode: { soundFile: "./audio/heavy-cineamtic-hit-166888.mp3", volPercent: 25},
            shipRespawn: { soundFile: "./audio/robot_01-47250.mp3", volPercent: 50},
            shipThrusters: { soundFile: "./audio/thrusters_loopwav-14699.mp3", volPercent: 100},
            shootBullet: { soundFile: "./audio/shoot02wav-14562.mp3", volPercent: 10},
        }

        this.sound = new Audio(sfx[soundEffect].soundFile);
        this.sound.setAttribute("preload", "auto");
        this.sound.setAttribute("controls", "none");
        this.sound.style.display = "none";
        document.body.appendChild(this.sound);
        this.SetVolume(sfx[soundEffect].volPercent);
        this.sound.loop = loop;
    }
    SetVolume(volPercent) {
        if (!(volPercent >= 0 && volPercent <= 100)) return console.error('Invalid volume percentage. Please provide a value between 0 and 100.');
        this.sound.volume = volPercent / 100;
    }
    Play() {
        if(audioManager.isAudioEnabled){
            try {
                this.sound.play();
            } catch(error){
                console.error(`Error playing sound: ${error}`);
            }
        }
    }
    Stop() {
        this.sound.pause();
    }
    Remove() {
        // Remove the element from the DOM after it has finished playing
        try {
            if (this.sound) {
                this.sound.addEventListener('ended', () => {
                    if (this.sound && this.sound.parentNode) {
                        this.sound.parentNode.removeChild(this.sound);
                    }
                });
            }
        } catch (error){
            console.error(`Error removing sound: ${error}`);
        }
    }
}

class Particle {
    constructor(x, y, color, velocityX, velocityY, size, lifespan) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.size = size;
        this.lifespan = lifespan;
        this.alpha = 1;
    }
    Update(secondsPassed) {
        this.x += this.velocityX * secondsPassed;
        this.y += this.velocityY * secondsPassed;
        this.alpha = Math.max(0, this.alpha - secondsPassed / this.lifespan);
    }
    Render() {
        context.globalAlpha = this.alpha;
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        context.fill();
        context.globalAlpha = 1;
    }
}

class JetEmitter {
    constructor(x, y) {
        this.particles = [];
        this.x = x;
        this.y = y;
        this.shouldEmit = false;
        this.particlesPerSec = 255;
        this.particleSize = 2;
        this.particleColor = 'orange';
        this.particleLifespan = 0.1;
        this.particleSpeedMultiplier = 0.25;
    }
    StartEmitting(){
        this.shouldEmit = true;
    }
    StopEmitting(){
        this.shouldEmit = false;
    }
    SetLocation(x, y, velX, velY){
        this.x = x;
        this.y = y;
        this.velX = velX;
        this.velY = velY;
    }
    Update(secondsPassed) {
        if(this.shouldEmit){
            const particlesQty = Math.floor(this.particlesPerSec * secondsPassed); // This is affecting quality!
            for (let i = 0; i < particlesQty ; i++) {
                const velocityX = this.velX;
                const velocityY = this.velY 
                const particle = new Particle(this.x, this.y, this.particleColor, velocityX * this.particleSpeedMultiplier, velocityY * this.particleSpeedMultiplier, this.particleSize, this.particleLifespan);
                this.particles.push(particle);
            }
        }
        for (const particle of this.particles) {
            particle.Update(secondsPassed);
        }
        this.particles = this.particles.filter((particle) => particle.alpha > 0);
    }
    Render() {
        for (const particle of this.particles) {
            particle.Render();
        }
    }  
    Destroy(){
        removeInstances(JetEmitter);
    }
}

class Explosion {
    constructor(x, y, particleCount = 10, particleSize = 1, colors = ['white'], particleLifespan) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.colors = colors;
        this.particleCount = particleCount;
        this.particleSize = particleSize;
        this.particleLifespan = particleLifespan

        for (let i = 0; i < this.particleCount; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const speed = Math.random() * 500 + 100;
            const velocityX = speed * Math.cos(angle);
            const velocityY = speed * Math.sin(angle);
            const particleColor = this.colors[Math.floor(Math.random() * this.colors.length)];
            const particle = new Particle(this.x, y, particleColor, velocityX, velocityY, this.particleSize, this.particleLifespan);
            this.particles.push(particle);
        }
    }
    Update(secondsPassed) {
        for (const particle of this.particles) {
            particle.Update(secondsPassed);
        }
        this.particles = this.particles.filter((particle) => particle.alpha > 0);

        if(this.particles.length == 0){
            const i = gameObjects.indexOf(this);
            return gameObjects.splice(i,1);
        }
    }
    Render() {
        for (const particle of this.particles) {
            particle.Render();
        }
    }
}

class ShipExplosion extends Explosion {
    constructor(x, y){
        const particleCount = 50;
        const particleSize = 1.5;
        const lifespan = 2;
        const colors = [
            'white',
            'white',
            'white',
            'white',
            'red',
            'pink',
            'rgba(0, 255, 255, 1)' // Shield color.
        ]
        super(x, y, particleCount, particleSize, colors, lifespan);
    }
}