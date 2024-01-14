export default class GameObject {
    ctx: CanvasRenderingContext2D;
    gameManager: any; // Definition needs importing to handle ' gameManager: GameManager '
    x: number;
    y: number;

    // Definition needs importing to handle ' gameManager: GameManager '
    constructor(ctx: CanvasRenderingContext2D, gameManager: any, x: number, y: number){
        this.ctx = ctx;
        this.gameManager = gameManager;
        this.x = x;
        this.y = y;
    }
    Update(secondsPassed: number){
    }
    Render(){
    }
}