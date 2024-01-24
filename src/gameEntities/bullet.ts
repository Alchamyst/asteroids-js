import GameCanvas from "../core/gameCanvas";
import GameManager from "../gameEntities/gameManager";
import PhysicsObject from "../core/physicsObject";
import { Sound } from "../core/audio";

export default class Bullet extends PhysicsObject {
    private angle: number;
    private height: number;
    private width: number;
    private speed: number;
    private bulletSoundEffect: Sound;
    private soundPlayed: boolean

    constructor(gameCanvas: GameCanvas, gameManager: GameManager, x: number, y: number, renderCollision: boolean, angle: number){
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
        this.gameManager.audioManager.CleanUp(this.bulletSoundEffect);
        this.gameManager.RemoveGameObject(this);
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