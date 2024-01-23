import PhysicsObject from "../core/physicsObject";
import Bullet from "./bullet";
import { JetEmitter, ShipExplosion } from "./particleEffects";

// Imports for type declarations.
import { Sound } from "../core/audio";
import GameCanvas from "../core/gameCanvas";

export default class Ship extends PhysicsObject {
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

    private debugShields: boolean;
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

    // Definition needs importing to handle ' gameManager: GameManager '
    constructor(gameCanvas: GameCanvas, gameManager: any, renderCollision: boolean, respawnTimer: number = 0, debugShields: boolean = false){
        const collisionRadius = 11;

        super(gameCanvas, gameManager, 0, 0, collisionRadius, renderCollision);
        
        this.x = this.canvasWidth / 2;
        this.y = this.canvasHeight / 2;
        this.radius = 15;
        this.speed = 10;
        this.velocityX = 0;
        this.velocityY = 0;
        this.rotateSpeed = 0.1;
        this.debugShields = debugShields;
        this.shieldTimer = 2;
        this.bulletTimer = 0;
        this.bulletFireDelay = 0.2;

        this.shieldSoundEffect = this.gameManager.audioManager.CreateSound('shieldDown');
        this.shipExplodeSoundEffect = this.gameManager.audioManager.CreateSound('shipExplode');
        this.shipRespawnSoundEffect = this.gameManager.audioManager.CreateSound('shipRespawn');
        this.thrusterSoundEffect = this.gameManager.audioManager.CreateSound('shipThrusters', true);

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
        this.jetEmitter = new JetEmitter(this.gameCanvas, this.gameManager, this.jetX, this.jetY);
        this.gameManager.AddGameObject(this.jetEmitter);
    }
    Update(secondsPassed: number){
        this.respawnTimer = Math.max(0, this.respawnTimer - secondsPassed); // Tick respawn timer.
        if(this.respawnTimer > 0) return; // Do not run updates if waiting to respawn.

        if(!this.hasRespawned){
            this.shipRespawnSoundEffect.Play();
            this.hasRespawned = true;
        }

        super.Update(secondsPassed);

        if(this.debugShields) this.shieldTimer = 5;

        // If the shield is down, take has hit something and doesn't have a shield up
        if(this.GetIsColliding() == true && this.shieldTimer == 0){
            return this.ShipWasHit();
        }

        // Tick bullet fire delay timer.
        this.bulletTimer += secondsPassed;

        // Check for inputs affecting ship actions.
        const currentInput = this.gameManager.inputManager.GetCurrentActions();
        this.wasMovingForward = this.movingForward;
        this.movingForward = currentInput.forwardButton;
        this.dirModifier = 0;
        if(currentInput.leftButton) this.dirModifier = -1;
        if(currentInput.rightButton) this.dirModifier = 1;
        if(currentInput.fireButton && this.bulletTimer >= this.bulletFireDelay){
            this.gameManager.AddGameObject(new Bullet(this.gameCanvas, this.gameManager, this.noseX, this.noseY, this.GetRenderCollision(), this.angle));
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
        this.gameManager.AddGameObject(new ShipExplosion(this.gameCanvas, this.gameManager, this.x, this.y));
        this.CleanUpEffects();
        this.gameManager.ShipDestroyed();
    }
    CleanUpEffects(){
        this.thrusterSoundEffect.Stop();
        this.gameManager.audioManager.CleanUp(this.shipExplodeSoundEffect);
        this.gameManager.audioManager.CleanUp(this.thrusterSoundEffect);
        this.gameManager.RemoveGameObject(this.jetEmitter);
    }
}