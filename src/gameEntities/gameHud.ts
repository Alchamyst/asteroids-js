import GameCanvas from "../core/gameCanvas";
import GameManager from "../gameEntities/gameManager";
import HudElement from "../core/hudElement";

export class DebugHUD extends HudElement {
    private gameState: string;
    private font: string;
    private fpsOutput: string;
    private asteroidsOutput: string;

    constructor(gameCanvas: GameCanvas, gameManager: GameManager){
        super(gameCanvas, gameManager, 0, 0); 
        this.x = this.canvasWidth-10;
        this.y = this.canvasHeight-10;
        this.font = '25px Arial';  
        this.fpsOutput = "FPS: ";
        this.gameState = "GameState: " + this.gameManager.GetGameState();
        this.asteroidsOutput = "Asteroids: " + this.gameManager.GetCurrentAsteroids();
    }
    Update(secondsPassed: number){
        this.gameState = "GameState: " + this.gameManager.GetGameState();
        this.asteroidsOutput = "Asteroids: " + this.gameManager.GetCurrentAsteroids();
        this.fpsOutput = "FPS: " + this.gameManager.GetFps();
    }
    Render(){
        this.ctx.font = this.font;
        this.ctx.fillStyle = this.color;
        this.ctx.fillText(this.gameState, this.x - this.ctx.measureText(this.gameState).width, this.y); 
        this.ctx.fillText(this.asteroidsOutput, this.x - this.ctx.measureText(this.asteroidsOutput).width, this.y - 30);    
        this.ctx.fillText(this.fpsOutput, this.x - this.ctx.measureText(this.fpsOutput).width, this.y -60);
    }
}

export class GameMsg extends HudElement {
    private font1: string;
    private font2: string;
    private text1: string;
    private text2: string;
    private text1Color: string;
    private text2Color: string;

    constructor(gameCanvas: GameCanvas, gameManager: GameManager, text1: string, text2: string, textColor1 = 'white', textColor2 = 'white'){
        super(gameCanvas, gameManager, 0, 0);
        this.font1 = '50px Arial';
        this.font2 = '20px Arial';
        this.text1 = text1 || 'Foo';
        this.text2 = text2 || 'Bar';
        this.text1Color = textColor1;
        this.text2Color = textColor2;
    }
    Update(secondsPassed: number){
    }
    Render(){
        this.ctx.fillStyle = this.text1Color;
        this.ctx.font = this.font1;
        this.ctx.fillText(this.text1, (this.canvasWidth - this.ctx.measureText(this.text1).width) /2, this.canvasHeight / 2);
        this.ctx.fillStyle = this.text2Color;
        this.ctx.font = this.font2;
        this.ctx.fillText(this.text2, (this.canvasWidth - (this.ctx.measureText(this.text2).width)) / 2, (this.canvasHeight / 2) + 40);
    }
}

export class ScoreCounter extends HudElement {
    private score: number;

    constructor(gameCanvas: GameCanvas, gameManager: GameManager){
        super(gameCanvas, gameManager, 0, 0);     
        this.score = this.gameManager.GetCurrentScore();
    }
    Update(secondsPassed: number){
        this.score = this.gameManager.GetCurrentScore();
    }
    Render(){
        this.ctx.strokeStyle = this.color;
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('SCORE: ' + this.score.toString(), 20, 35);
    }
}    

export class LivesCounter extends HudElement {
    private lives: number;

    constructor(gameCanvas: GameCanvas, gameManager: GameManager){
        super(gameCanvas, gameManager, 1175, 10);     
        this.lives = this.gameManager.GetCurrentLives();
        this.color = 'lime';
    }
    Update(secondsPassed: number){
        this.lives = this.gameManager.GetCurrentLives();
    }
    Render(){
        let points = [[9,9],[-9,9]];
        let renderX = this.x 
        this.ctx.strokeStyle = this.color;

        for(let i = 0; i < this.lives; i++){
            this.ctx.beginPath();
            this.ctx.moveTo(renderX, this.y);
            for(let j = 0; j < points.length; j++){
                this.ctx.lineTo(renderX + points[j][0], this.y + points[j][1]);
            }
            this.ctx.closePath();
            this.ctx.stroke();
            renderX -= 30;
        }
    }
}