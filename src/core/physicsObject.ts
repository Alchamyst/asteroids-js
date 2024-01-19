import GameObject from "./gameObject";

// Imports for type declarations.
import GameCanvas from "./gameCanvas";

export default class PhysicsObject extends GameObject {
    private collisionRadius: number;
    private renderCollision: boolean;
    private isColliding: boolean;

    // Definition needs importing to handle ' gameManager: GameManager '
    constructor(gameCanvas: GameCanvas, gameManager: any, x: number, y: number, collisionRadius: number, renderCollision: boolean){
        super(gameCanvas, gameManager, x, y);
        this.collisionRadius = collisionRadius;
        this.renderCollision = renderCollision;
        this.isColliding = false; 
    }
    Update(secondsPassed: number){
    }
    Render(){
        if(this.renderCollision){
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.isColliding ? 'red' : 'yellow';
            this.ctx.arc(this.x, this.y, this.collisionRadius,0,2* Math.PI);
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }
    GetCollisionStatus(){
        return this.isColliding;
    }
    GetCollisionRadius(){
        return this.collisionRadius;
    }
    SetColliding(isColliding: boolean){
        this.isColliding = isColliding;
    }
}