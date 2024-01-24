import InputManager from "../core/inputManager";
import GameCanvas from "../core/gameCanvas";
import { AudioManager, Sound } from "../core/audio";
import { detectCollisions } from "../core/collisionDetection";

import Asteroid from "./asteroid";
import Ship from "./ship";
import { DebugHUD, GameMsg, LivesCounter, ScoreCounter } from "./gameHud";


// Imports for type declarations.
import GameObject from "../core/gameObject";

export default class GameManager {
    inputManager: InputManager;
    audioManager: AudioManager;
    gameCanvas: GameCanvas;

    private fps: number;
    private secondsPassed: number;
    private oldTimeStamp: number;

    private debugHud: boolean;
    private debugShields: boolean;
    private easyLevels: boolean;
    private renderCollision: boolean;

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

    // ANY type for debugSettings needs correcting here
    constructor(gameCanvas: GameCanvas, debugSettings: any){
        this.gameObjects = [];

        this.inputManager = new InputManager();
        this.audioManager = new AudioManager();
        this.gameCanvas = gameCanvas;
        this.fps = 0;
        this.secondsPassed = 0;
        this.oldTimeStamp = 0;

        this.debugHud = debugSettings.debugHud;
        this.debugShields = debugSettings.debugShields;
        this.easyLevels = debugSettings.easyLevels;
        this.renderCollision = debugSettings.renderCollision;

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
        if (this.easyLevels){
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
        if(this.debugHud) this.AddGameObject(new DebugHUD(this.gameCanvas, this));
        this.AddGameObject(new LivesCounter(this.gameCanvas, this));
        this.AddGameObject(new ScoreCounter(this.gameCanvas, this));
        this.AddGameObject(new GameMsg(this.gameCanvas, this, 'Asteroids','Press Enter To Start'));
        this.SpawnAsteroids(6, 1);
        this.SpawnAsteroids(3, 2);
        this.SpawnAsteroids(2, 3);
    }
    DoGameLoop(timeStamp: number){
        if (this.gameState === 'GAME_OVER') {
            console.log('Game is in GAME_OVER state. Checking update logic.');
        }

        this.secondsPassed = (timeStamp - this.oldTimeStamp) / 1000;
        this.oldTimeStamp = timeStamp;
        this.fps = Math.round(1 / this.secondsPassed);
        this.gameCanvas.ClearScreen();

        // Loop over all game objects and update.
        for (let i = 0; i < this.gameObjects.length; i++) {
            this.gameObjects[i].Update(this.secondsPassed);
        }

        detectCollisions(this.gameObjects);
        this.CheckGameState();

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
    GetFps(){ return this.fps }
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
        this.AddGameObject(new GameMsg(this.gameCanvas, this,  `LEVEL ${this.currentLevel} COMPLETE`,'Press Enter To Continue.'));
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
            return this.AddGameObject(new GameMsg(this.gameCanvas, this, 'MISSION COMPLETE','Press Enter To Play Again', 'lime'));
        }
        this.gameState = 'GAME_OVER';
        this.AddGameObject(new GameMsg(this.gameCanvas, this, 'GAME OVER','Press Enter To Try Again', 'red'));
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
            this.AddGameObject(new Asteroid(this.gameCanvas, this, this.renderCollision, level));
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
        this.player = new Ship(this.gameCanvas, this, this.renderCollision, respawn, this.debugShields);
        this.AddGameObject(this.player);
    }
}