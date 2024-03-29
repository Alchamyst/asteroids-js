import GameCanvas from "./gameCanvas";
import GameManager from "../gameEntities/gameManager";

export default class GameObject {
    gameCanvas: GameCanvas;
    canvasWidth: number;
    canvasHeight: number;
    ctx: CanvasRenderingContext2D;
    gameManager: GameManager;
    x: number;
    y: number;

    constructor(gameCanvas: GameCanvas, gameManager: GameManager, x: number, y: number){
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