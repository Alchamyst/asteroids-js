import GameCanvas from "./gameCanvas";
import GameManager from "../gameEntities/gameManager";
import GameObject from "./gameObject";

export default class HudElement extends GameObject {
    color: string;

    constructor(gameCanvas: GameCanvas, gameManager: GameManager, startX: number, startY: number){
        super(gameCanvas, gameManager, startX, startY);
        this.color = 'white';
    }
}