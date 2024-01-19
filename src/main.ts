import GameCanvas from "./core/gameCanvas";
import GameObject from "./core/gameObject";
import PhysicsObject from "./core/physicsObject";
import InputManager from "./core/inputManager";
import { AudioManager, Sound } from "./core/audio";

import { Explosion, JetEmitter, ShipExplosion } from "./gameEntities/particleEffects";


// debug settings
const debugHud = false;
const debugShields = false;
const easyLevels = false;
const renderCollision = false;

let secondsPassed: number = 0;
let oldTimeStamp: number = 0;
let fps: number;

let gameManager: GameManager;

document.addEventListener('DOMContentLoaded', init); 

function init(){
    const myCanvasID = 'my-canvas';
    const controlsID = 'controls';
    const noGameID = 'no-game';

    const myCanvas = document.getElementById(myCanvasID);
    const controls = document.getElementById(controlsID);
    const noGame = document.getElementById(noGameID);
    const shouldLoadGame = checkDevice() && checkResolution() ? true : false;

    if(shouldLoadGame){
        if(!(myCanvas instanceof HTMLCanvasElement)) throw new Error(`Unable to find canvas with ${myCanvasID}`);
        if(controls) controls.style.display = 'block';
        if(myCanvas) myCanvas.style.display = 'block';
        if(noGame) noGame.style.display = 'none';  
        const gameCanvas = new GameCanvas(myCanvas);
        gameManager = new GameManager(gameCanvas);
        gameManager.Init();
        window.requestAnimationFrame(gameLoop);
    }
    if(!shouldLoadGame){ 
        if(controls) controls.style.display = 'none';
        if(myCanvas) myCanvas.style.display = 'none';
        if(noGame) noGame.style.display = 'block';        
    }
}

// Confirm we should still load the game if on a touch device, as a keyboard is required.
function checkDevice(){
    if (navigator.maxTouchPoints > 1){
        const message = "A keyboard is required to play this game on your device.\nDo you want to still load the game?";
        return confirm(message);
    }
    return true;
}
function checkResolution(){
    const recommendedWidth = 1225;
    const recommendedHeight = 825;
    const browserWidth = window.innerWidth;
    const browserHeight = window.innerHeight;

    console.log(`browserWidth = ${browserWidth}`);
    console.log(`browserHeight = ${browserHeight}`);

    if( (browserWidth < recommendedWidth) || (browserHeight <  recommendedHeight) ){
        const message = "Your window size is lower than the recommended minimum of 1250x825.\nDo you want to still load the game?";
        return confirm(message);
    }
    return true;
}

function gameLoop(timeStamp: number) {
    gameManager.DoGameLoop(timeStamp);
    window.requestAnimationFrame(gameLoop);
}

const detectCollisions = (gameObjects: Array<GameObject>) => {
    let obj1;
    let obj2;

    // Reset collision state for all PhysicsObjects.
    for(let i=0; i < gameObjects.length; i++) {
        const object = gameObjects[i];
        if(object instanceof PhysicsObject){
            object.SetColliding(false); 
        }
    }

    // Check Physics objects for Collisions
    for (let i = gameObjects.length -1; i >= 0; i--){
        obj1 = gameObjects[i];

        if (obj1 instanceof PhysicsObject){
            for (let j = gameObjects.length - 1; j >= 0; j--){
                obj2 = gameObjects[j];
                
                if (obj2 instanceof PhysicsObject && i !==j){
                    if(circleIntersect(obj1.x, obj1.y, obj1.GetCollisionRadius(), obj2.x, obj2.y, obj2.GetCollisionRadius())){

                        // Don't treat bullets as colliding with ship.
                        if ((obj1 instanceof Bullet || obj2 instanceof Bullet) && (obj1 instanceof Ship || obj2 instanceof Ship)) return;

                        obj1.SetColliding(true);
                        obj2.SetColliding(true);
                        // gameObject()
                        if ((obj1 instanceof Bullet || obj2 instanceof Bullet) && (obj1 instanceof Asteroid || obj2 instanceof Asteroid)){
                            if(obj1 instanceof Asteroid && obj2 instanceof Bullet) {
                                obj2.Remove();
                                obj1.ScoredHit(); 
                            }

                            if(obj2 instanceof Asteroid && obj1 instanceof Bullet) {
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

function circleIntersect(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number){
    // Calculate the distance between the two circles
    let squareDistance = (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);

    // When the distance is smaller or equal to the sum of the two radius, the circles touch or overlap
    return squareDistance <= ((r1 + r2) * (r1 + r2))
}


class GameManager {
    inputManager: InputManager;
    audioManager: AudioManager;
    gameCanvas: GameCanvas;

    private gameObjects: Array<GameObject>;

    private gameState: string;
    private currentLevel;
    private currentLives: number;
    private currentScore: number;
    private currentAsteroids: number;
    private bonusLivesScore: number;
    private isSoundEnabled: boolean;
    private gameOverSound: Sound;
    private missionCompleteSound: Sound;
    private levelData;
    private player: Ship | undefined;
    private playerRespawnTime: number;

    constructor(gameCanvas: GameCanvas){
        this.gameObjects = [];

        this.inputManager = new InputManager();
        this.audioManager = new AudioManager();
        this.gameCanvas = gameCanvas;

        this.gameState = 'START';
        this.currentLevel = 1;
        this.currentLives = 0;
        this.currentScore = 0;
        this.currentAsteroids = 0;
        this.bonusLivesScore = 25;
        this.isSoundEnabled = this.audioManager.CheckAudioEnabled();
        this.gameOverSound = this.audioManager.CreateSound('gameOver');
        this.missionCompleteSound = this.audioManager.CreateSound('missionComplete'); ;
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
        this.gameCanvas.ClearScreen();

        // Create HUD & Some Asteroids
        if(debugHud) this.AddGameObject(new DebugHUD(this.gameCanvas));
        this.AddGameObject(new LivesCounter(this.gameCanvas));
        this.AddGameObject(new ScoreCounter(this.gameCanvas));
        this.AddGameObject(new GameMsg(this.gameCanvas, 'Asteroids','Press Enter To Start'));
        this.SpawnAsteroids(6, 1);
        this.SpawnAsteroids(3, 2);
        this.SpawnAsteroids(2, 3);
    }
    DoGameLoop(timeStamp: number){
        secondsPassed = (timeStamp - oldTimeStamp) / 1000;
        oldTimeStamp = timeStamp;
        fps = Math.round(1 / secondsPassed);
        this.gameCanvas.ClearScreen();

        // Loop over all game objects and update.
        for (let i = 0; i < this.gameObjects.length; i++) {
            this.gameObjects[i].Update(secondsPassed);
        }

        detectCollisions(this.gameObjects);
        gameManager.CheckGameState();

        // Loop over all game objects and draw.
        for (let i = 0; i < this.gameObjects.length; i++) {
            this.gameObjects[i].Render();
        }
    }
    AddGameObject(gameObject: GameObject){
        this.gameObjects.push(gameObject);
    }
    RemoveGameObject(gameObject: GameObject){
        const i = this.gameObjects.indexOf(gameObject);
        this.gameObjects.splice(i,1);
    }
    RemoveGameObjectTypes(itemType: any){
        this.gameObjects = this.gameObjects.filter(item => !(item instanceof itemType)); 
    }
    CheckGameState(){
        const currentInput = this.inputManager.GetCurrentActions();

        switch(this.gameState) {
            case 'START':
                if(currentInput.startButton){
                    // removeInstances(GameMsg);
                    this.RemoveGameObjectTypes(GameMsg);
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
                if(currentInput.startButton){
                    // removeInstances(GameMsg);
                    this.RemoveGameObjectTypes(GameMsg);
                    this.NextLevel();
                } 
                break;

            case 'GAME_OVER':
                if(currentInput.startButton){
                    // removeInstances(GameMsg);
                    this.RemoveGameObjectTypes(GameMsg);
                    this.NewGame();
                } 
                break;

            default:
                console.log("GameState Error.")
        }
    }
    GetGameState(){ return this.gameState }
    GetCurrentAsteroids(){ return this.currentAsteroids }
    GetCurrentScore(){ return this.currentScore }
    GetCurrentLives(){ return this.currentLives }
    IsSoundEnabled(){ return this.isSoundEnabled }
    NewGame(){
        this.gameState = 'LEVEL_SETUP';
        this.currentLevel = 1;
        this.currentScore = 0;
        this.LevelSetup();
    }
    LevelComplete(){
        this.gameState = 'LEVEL_COMPLETE'; 
        if(this.player){
            this.player.CleanUpEffects(); 
        }
        this.RemoveGameObjectTypes(Ship);
        this.AddScore(this.currentLives * this.bonusLivesScore);
        this.AddGameObject(new GameMsg(this.gameCanvas, `LEVEL ${this.currentLevel} COMPLETE`,'Press Enter To Continue.'));
    }
    NextLevel(){
        this.gameState = 'LEVEL_SETUP';  
        this.currentLevel += 1;
        this.LevelSetup();
    }
    GameOver(){
        if(this.player){
            this.player.CleanUpEffects(); 
        }
        this.RemoveGameObjectTypes(Ship);
        if(this.currentLevel == Object.keys(this.levelData).length){
            this.gameState = 'GAME_OVER';
            this.missionCompleteSound.Play();
            return this.AddGameObject(new GameMsg(this.gameCanvas, 'MISSION COMPLETE','Press Enter To Play Again', 'lime'));
        }
        this.gameState = 'GAME_OVER';
        this.AddGameObject(new GameMsg(this.gameCanvas, 'GAME OVER','Press Enter To Try Again', 'red'));
        this.gameOverSound.Play();
    }
    AddScore(points: number){
        this.currentScore += points; 
    }
    ShipDestroyed(){
        this.currentLives -= 1;
        if(this.currentLives <= 0) return this.GameOver();

        this.RemoveGameObjectTypes(Ship);
        this.NewShip();
    }
    LevelSetup(){
        this.RemoveGameObjectTypes(Asteroid);
        this.RemoveGameObjectTypes(Ship);

        this.currentLives = 3;
        this.currentAsteroids = 0;

        const currentLevelData = this.levelData[this.currentLevel as keyof typeof this.levelData] as {
            bigAsteroids: number;
            mediumAsteroids: number;
            smallAsteroids: number;
        };

        this.SpawnAsteroids(currentLevelData.bigAsteroids, 1);
        this.SpawnAsteroids(currentLevelData.mediumAsteroids, 2);
        this.SpawnAsteroids(currentLevelData.smallAsteroids, 3);

        this.NewShip(0);

        this.gameState = 'LEVEL_RUNNING'; 
    }
    SpawnAsteroids(amount: number, level = 1){
        for(let i = 0; i < amount; i++){
            this.AddGameObject(new Asteroid(this.gameCanvas, level));
        }  
    }
    TrackAsteroids(){
        let asteroidCount = 0;
        for(let i=0; i < this.gameObjects.length; i++) {
            if(this.gameObjects[i] instanceof Asteroid){
                asteroidCount += 1; 
            }
        }
        this.currentAsteroids = asteroidCount;

    }
    NewShip(respawn = this.playerRespawnTime){
        this.player = new Ship(this.gameCanvas, respawn);
        this.AddGameObject(this.player);
    }
}

class HudElement extends GameObject {
    color: string;

    constructor(gameCanvas: GameCanvas, startX: number, startY: number){
        super(gameCanvas, gameManager, startX, startY);
        this.color = 'white';
    }
}

class GameMsg extends HudElement {
    private font1: string;
    private font2: string;
    private text1: string;
    private text2: string;
    private text1Color: string;
    private text2Color: string;

    constructor(gameCanvas: GameCanvas, text1: string, text2: string, textColor1 = 'white', textColor2 = 'white'){
        super(gameCanvas ,0,0);
        this.font1 = '50px Arial';
        this.font2 = '20px Arial';
        this.text1 = text1 || 'Foo';
        this.text2 = text2 || 'Bar';
        this.text1Color = textColor1;
        this.text2Color = textColor2;
    }
    Update(secondsPassed: number){
    }
    Render(){
        this.ctx.fillStyle = this.text1Color;
        this.ctx.font = this.font1;
        this.ctx.fillText(this.text1, (this.canvasWidth - this.ctx.measureText(this.text1).width) /2, this.canvasHeight / 2);
        this.ctx.fillStyle = this.text2Color;
        this.ctx.font = this.font2;
        this.ctx.fillText(this.text2, (this.canvasWidth - (this.ctx.measureText(this.text2).width)) / 2, (this.canvasHeight / 2) + 40);
    }
}

class DebugHUD extends HudElement {
    private gameState: string;
    private font: string;
    private fpsOutput: string;
    private asteroidsOutput: string;

    constructor(gameCanvas: GameCanvas){
        super(gameCanvas, 0, 0); 
        this.x = this.canvasWidth-10;
        this.y = this.canvasHeight-10;
        this.font = '25px Arial';  
        this.fpsOutput = "FPS: ";
        this.gameState = "GameState: " + gameManager.GetGameState();
        this.asteroidsOutput = "Asteroids: " + gameManager.GetCurrentAsteroids();
    }
    Update(secondsPassed: number){
        this.gameState = "GameState: " + gameManager.GetGameState();
        this.asteroidsOutput = "Asteroids: " + gameManager.GetCurrentAsteroids();
        this.fpsOutput = "FPS: " + fps;
    }
    Render(){
        this.ctx.font = this.font;
        this.ctx.fillStyle = this.color;
        this.ctx.fillText(this.gameState, this.x - this.ctx.measureText(this.gameState).width, this.y); 
        this.ctx.fillText(this.asteroidsOutput, this.x - this.ctx.measureText(this.asteroidsOutput).width, this.y - 30);    
        this.ctx.fillText(this.fpsOutput, this.x - this.ctx.measureText(this.fpsOutput).width, this.y -60);
    }
}

class ScoreCounter extends HudElement {
    private score: number;

    constructor(gameCanvas: GameCanvas){
        super(gameCanvas, 0, 0);     
        this.score = gameManager.GetCurrentScore();
    }
    Update(secondsPassed: number){
        this.score = gameManager.GetCurrentScore();
    }
    Render(){
        this.ctx.strokeStyle = this.color;
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('SCORE: ' + this.score.toString(), 20, 35);
    }
}    

class LivesCounter extends HudElement {
    private lives: number;

    constructor(gameCanvas: GameCanvas){
        super(gameCanvas, 1175, 10);     
        this.lives = gameManager.GetCurrentLives();
        this.color = 'lime';
    }
    Update(secondsPassed: number){
        this.lives = gameManager.GetCurrentLives();
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

class Ship extends PhysicsObject {
    private strokeColor: string;
    private radius: number;
    private noseX: number;
    private noseY: number;

    private angle: number;
    private speed: number;
    private velocityX: number;
    private velocityY: number;
    private rotateSpeed: number;
    private dirModifier: number;
    private movingForward: boolean;
    private wasMovingForward: boolean;

    private shieldTimer: number;
    private bulletTimer: number;
    private bulletFireDelay: number;
    private respawnTimer: number;
    private hasRespawned: boolean;

    private shieldSoundEffect: Sound;
    private shipExplodeSoundEffect: Sound;
    private shipRespawnSoundEffect: Sound;
    private thrusterSoundEffect: Sound
    
    private jetX: number;
    private jetY: number;
    private jetEmitter: JetEmitter;



    constructor(gameCanvas: GameCanvas, respawnTimer: number = 0){
        const collisionRadius = 11;

        super(gameCanvas, gameManager, 0, 0, collisionRadius, renderCollision);
        
        this.x = this.canvasWidth / 2;
        this.y = this.canvasHeight / 2;
        this.radius = 15;
        this.speed = 10;
        this.velocityX = 0;
        this.velocityY = 0;
        this.rotateSpeed = 0.1;
        this.shieldTimer = 2;
        this.bulletTimer = 0;
        this.bulletFireDelay = 0.2;

        this.shieldSoundEffect = gameManager.audioManager.CreateSound('shieldDown');
        this.shipExplodeSoundEffect = gameManager.audioManager.CreateSound('shipExplode');
        this.shipRespawnSoundEffect = gameManager.audioManager.CreateSound('shipRespawn');
        this.thrusterSoundEffect = gameManager.audioManager.CreateSound('shipThrusters', true);

        this.strokeColor = 'white';

        this.noseX = this.x + 15;
        this.noseY = this.y;
        this.angle = Math.random();
        this.dirModifier = 0;
        this.respawnTimer = respawnTimer;
        this.hasRespawned = false;
        this.movingForward = false;
        this.wasMovingForward = false;

        this.jetX = this.x;
        this.jetY = this.y;
        this.jetEmitter = new JetEmitter(this.gameCanvas, gameManager, this.jetX, this.jetY);
        gameManager.AddGameObject(this.jetEmitter);
    }
    Update(secondsPassed: number){
        this.respawnTimer = Math.max(0, this.respawnTimer - secondsPassed); // Tick respawn timer.
        if(this.respawnTimer > 0) return; // Do not run updates if waiting to respawn.

        if(!this.hasRespawned){
            this.shipRespawnSoundEffect.Play();
            this.hasRespawned = true;
        }

        super.Update(secondsPassed);

        if(debugShields) this.shieldTimer = 5;

        // If the shield is down, take has hit something and doesn't have a shield up
        if(this.GetCollisionStatus() == true && this.shieldTimer == 0){
            return this.ShipWasHit();
        }

        // Tick bullet fire delay timer.
        this.bulletTimer += secondsPassed;

        // Check for inputs affecting ship actions.
        const currentInput = gameManager.inputManager.GetCurrentActions();
        this.wasMovingForward = this.movingForward;
        this.movingForward = currentInput.forwardButton;
        this.dirModifier = 0;
        if(currentInput.leftButton) this.dirModifier = -1;
        if(currentInput.rightButton) this.dirModifier = 1;
        if(currentInput.fireButton && this.bulletTimer >= this.bulletFireDelay){
            gameManager.AddGameObject(new Bullet(this.gameCanvas, this.noseX, this.noseY, this.angle));
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
                this.thrusterSoundEffect.Play();
                this.jetEmitter.StartEmitting();
            } 
            if(!this.movingForward){
                this.thrusterSoundEffect.Stop();
                this.jetEmitter.StopEmitting()
            }
        }

        // Move the ship to the other side of the screen if we move out of bounds.
        if(this.x < this.radius) this.x = this.canvasWidth; 
        if(this.x > this.canvasWidth) this.x = this.radius; 
        if(this.y < this.radius) this.y = this.canvasHeight; 
        if(this.y > this.canvasHeight) this.y = this.radius; 

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
        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.beginPath();
        for(let i = 0; i < 3; i++){
            this.ctx.lineTo(this.x - this.radius * Math.cos(vertAngle * i + radians), this.y - this.radius * Math.sin(vertAngle * i + radians))
        }
        this.ctx.closePath();
        this.ctx.stroke();

        // Render front nose marker. 
        this.noseX = this.x - this.radius * Math.cos(radians);
        this.noseY = this.y - this.radius * Math.sin(radians);
        this.ctx.strokeStyle = 'red';
        this.ctx.beginPath();
        this.ctx.arc(this.noseX, this.noseY, 1.5,0,2* Math.PI);
        this.ctx.closePath();
        this.ctx.stroke();

        // Render shield visual.
        if (this.shieldTimer > 0){
            let opacity = this.shieldTimer > 1 ? 0.9 : this.shieldTimer;
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(0, 255, 255, ${opacity})`;
            this.ctx.arc(this.x, this.y, (this.GetCollisionRadius()*1.75),0,2* Math.PI);
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }
    ShipWasHit(){
        this.shipExplodeSoundEffect.Play();
        gameManager.AddGameObject(new ShipExplosion(this.gameCanvas, gameManager, this.x, this.y));
        this.CleanUpEffects();
        gameManager.ShipDestroyed();
    }
    CleanUpEffects(){
        this.thrusterSoundEffect.Stop();
        gameManager.audioManager.CleanUp(this.shipExplodeSoundEffect);
        gameManager.audioManager.CleanUp(this.thrusterSoundEffect);
        // this.jetEmitter.Destroy();
        gameManager.RemoveGameObject(this.jetEmitter);
    }
}

class Bullet extends PhysicsObject {
    private angle: number;
    private height: number;
    private width: number;
    private speed: number;
    private bulletSoundEffect: Sound;
    private soundPlayed: boolean

    constructor(gameCanvas: GameCanvas, x: number, y: number, angle: number){
        const collisionRadius = 3;

        super(gameCanvas, gameManager, x, y, collisionRadius, renderCollision);

        this.angle = angle;
        this.height = 4;
        this.width = 4;
        this.speed = 2000;
        this.bulletSoundEffect = gameManager.audioManager.CreateSound('shootBullet');
        this.soundPlayed = false;    
    }
    Remove(){
        gameManager.audioManager.CleanUp(this.bulletSoundEffect);
        gameManager.RemoveGameObject(this);
    }
    Update(secondsPassed: number){
        super.Update(secondsPassed);

        if(!this.soundPlayed){
            this.bulletSoundEffect.Play();
            this.soundPlayed = true;
        }
        var radians = this.angle / Math.PI * 180;
        this.x -= Math.cos(radians) * this.speed * secondsPassed;
        this.y -= Math.sin(radians) * this.speed * secondsPassed;

        if(this.x < -25 || this.y < -25 || this.x > this.canvasWidth +25 || this.y > this.canvasHeight +25){
            this.Remove();
        }
    }
    Render(){
        super.Render();

        this.ctx.fillStyle = 'pink';
        this.ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Asteroid extends PhysicsObject {
    private asteroidScores: { 1: number, 2: number, 3: number };

    private level: number;

    private angle: number;
    private speed: number;
    private radius: number;
    private strokeColor: string;
    private renderRotation: number;
    private renderRotationSpeed: number
    private shotSoundEffect: Sound;

    constructor(gameCanvas: GameCanvas, level = 1, startX?: number, startY?: number ){
        const asteroidSizes = {
            1: 50,
            2: 25,
            3: 15
        }
        const asteroidCollisions = {
            1: 46,
            2: 22,
            3: 12
        }
        const asteroidSpeeds = {
            1: 200,
            2: 240,
            3: 275
        }

        const asteroidRotationSpeeds = {
            1: (Math.random() + 0.1) * 2.75,
            2: (Math.random() + 0.15) * 3.25,
            3: (Math.random() + 0.15) * 3.75
        }
   
        const collisionRadius = asteroidCollisions[level as keyof typeof asteroidCollisions];

        super(gameCanvas, gameManager, 0, 0, collisionRadius, renderCollision);

        this.x = startX || Math.floor(Math.random() * this.canvasWidth);
        this.y = startY || Math.floor(Math.random() * this.canvasHeight);
        
        // NOTE: To be moved to GameManager
        this.asteroidScores = {
            1: 5,
            2: 7,
            3: 9
        }

        this.level = level || 1;
        this.angle = Math.floor(Math.random() * 328);
        this.strokeColor = 'rgb(180,138,113)';

        this.renderRotation = 0;

        this.shotSoundEffect = gameManager.audioManager.CreateSound('asteroidExplode');

        this.speed = asteroidSpeeds[level as keyof typeof asteroidSpeeds]
        this.renderRotationSpeed = asteroidRotationSpeeds[level as keyof typeof asteroidRotationSpeeds];
        this.radius = asteroidSizes[level as keyof typeof asteroidSizes]
        
    }
    ScoredHit(){
        this.shotSoundEffect.Play();
        gameManager.AddScore(this.asteroidScores[this.level as keyof typeof this.asteroidScores] ); // NOTE: scores to be moved to gameManager so this will need updating.
        gameManager.AddGameObject(new Explosion(this.gameCanvas, gameManager, this.x, this.y, 10, 2, ['brown'], 1));
        if(this.level === 1 || this.level === 2){
            const spawnLevel = this.level+1;
            gameManager.AddGameObject(new Asteroid(this.gameCanvas, spawnLevel, this.x - 5, this.y - 5));
            gameManager.AddGameObject(new Asteroid(this.gameCanvas, spawnLevel, this.x + 5, this.y + 5));
        }
        gameManager.audioManager.CleanUp(this.shotSoundEffect);
        gameManager.RemoveGameObject(this);
    }
    Update(secondsPassed: number){
        super.Update(secondsPassed);

        // Update the rendering rotation over time.
        this.renderRotation += this.renderRotationSpeed * secondsPassed;

        // Update asteroid location over time.
        var radians = this.angle / Math.PI * 180;
        this.x += Math.cos(radians) * this.speed * secondsPassed;
        this.y += Math.sin(radians) * this.speed * secondsPassed;

        // Move the asteroid to the other side of the screen if we move out of bounds.
        if(this.x < (this.radius/2)) this.x = this.canvasWidth;
        if(this.x > this.canvasWidth) this.x = this.radius; 
        if(this.y < (this.radius/2)) this.y = this.canvasHeight;
        if(this.y > this.canvasHeight) this.y = this.radius;
    }
    Render(){
        super.Render();

        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.beginPath();
        let vertAngle = ((Math.PI * 2) / 6);
        
        // Apply rendering rotation to the asteroid's veritces.
        var radians = this.angle / Math.PI * 180 + this.renderRotation;
        for(let i = 0; i < 6; i++){
            this.ctx.lineTo(this.x - this.radius * Math.cos(vertAngle * i + radians), this.y - this.radius * Math.sin(vertAngle * i + radians))
        }
        this.ctx.closePath();
        this.ctx.stroke();
    }
}