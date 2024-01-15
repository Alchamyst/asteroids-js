import GameCanvas from "./gameCanvas";

export default class GameObject {
    gameCanvas: GameCanvas;
    canvasWidth: number;
    canvasHeight: number;
    ctx: CanvasRenderingContext2D;
    gameManager: any; // Definition needs importing to handle ' gameManager: GameManager '
    x: number;
    y: number;

    // Definition needs importing to handle ' gameManager: GameManager '
    constructor(gameCanvas: GameCanvas, gameManager: any, x: number, y: number){
        this.gameCanvas = gameCanvas;
        this.canvasWidth = gameCanvas.GetCanvas().width;
        this.canvasHeight = gameCanvas.GetCanvas().height;
        this.ctx = this.gameCanvas.GetCtx();
        this.gameManager = gameManager;
        this.x = x;
        this.y = y;
    }
    Update(secondsPassed: number){
    }
    Render(){
    }
}