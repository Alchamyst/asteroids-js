import GameObject from "./gameObject";

// Imports for type declarations.
import GameCanvas from "./gameCanvas";

export default class HudElement extends GameObject {
    color: string;

    // Definition needs importing to handle ' gameManager: GameManager '
    constructor(gameCanvas: GameCanvas, gameManager: any, startX: number, startY: number){
        super(gameCanvas, gameManager, startX, startY);
        this.color = 'white';
    }
}