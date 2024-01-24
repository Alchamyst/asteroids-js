import GameCanvas from "./gameCanvas";
import GameManager from "../gameEntities/gameManager";
import GameObject from "./gameObject";



export default class Particle extends GameObject {
    private color: string;
    private velocityX: number;
    private velocityY: number;
    private size: number;
    private lifespan: number;
    private alpha: number;

    constructor(gameCanvas: GameCanvas, gameManager: GameManager, x: number, y: number, color: string, velocityX: number, velocityY: number, size: number, lifespan: number) {
        super(gameCanvas, gameManager, x, y)
        this.color = color;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.size = size;
        this.lifespan = lifespan;
        this.alpha = 1;
    }
    Update(secondsPassed: number) {
        this.x += this.velocityX * secondsPassed;
        this.y += this.velocityY * secondsPassed;
        this.alpha = Math.max(0, this.alpha - secondsPassed / this.lifespan);
    }
    Render() {
        this.ctx.globalAlpha = this.alpha;
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
    }
    GetAlpha(){
       return this.alpha;
    }
}