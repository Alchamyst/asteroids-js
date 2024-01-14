import GameObject from "./gameObject";

export default class PhysicsObject extends GameObject {
    private collisionRadius: number;
    private renderCollision: boolean;
    private isColliding: boolean;

    constructor(ctx: any, x: number, y: number, collisionRadius: number, renderCollision: boolean){
        super(ctx, x, y);
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