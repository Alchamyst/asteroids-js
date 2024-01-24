import GameCanvas from "../core/gameCanvas";
import GameManager from "../gameEntities/gameManager";
import PhysicsObject from "../core/physicsObject";

import { Explosion } from "./particleEffects";
import { Sound } from "../core/audio";

export default class Asteroid extends PhysicsObject {
    private asteroidScores: { 1: number, 2: number, 3: number };

    private level: number;

    private angle: number;
    private speed: number;
    private radius: number;
    private strokeColor: string;
    private renderRotation: number;
    private renderRotationSpeed: number
    private shotSoundEffect: Sound;

    constructor(gameCanvas: GameCanvas, gameManager: GameManager, renderCollision: boolean, level = 1, startX?: number, startY?: number ){
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
        this.gameManager.AddScore(this.asteroidScores[this.level as keyof typeof this.asteroidScores] ); // NOTE: scores to be moved to gameManager so this will need updating.
        this.gameManager.AddGameObject(new Explosion(this.gameCanvas, this.gameManager, this.x, this.y, 10, 2, ['brown'], 1));
        if(this.level === 1 || this.level === 2){
            const spawnLevel = this.level+1;
            this.gameManager.AddGameObject(new Asteroid(this.gameCanvas, this.gameManager, this.GetRenderCollision(), spawnLevel, this.x - 5, this.y - 5));
            this.gameManager.AddGameObject(new Asteroid(this.gameCanvas, this.gameManager, this.GetRenderCollision(), spawnLevel, this.x + 5, this.y + 5));
        }
        this.gameManager.audioManager.CleanUp(this.shotSoundEffect);
        this.gameManager.RemoveGameObject(this);
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