import GameCanvas from "./core/gameCanvas";
import GameManager from "./gameEntities/gameManager";

const debugSettings = {
    debugHud: false,
    debugShields: false,
    easyLevels: false,
    renderCollision: false
}

let gameManager: GameManager;

document.addEventListener('DOMContentLoaded', init); 

function init(){
    const myCanvasID = 'my-canvas';
    const controlsID = 'controls';
    const noGameID = 'no-game';

    const myCanvas = document.getElementById(myCanvasID);
    const controls = document.getElementById(controlsID);
    const noGame = document.getElementById(noGameID);
    const shouldLoadGame = checkDevice() ? true : false;

    if(shouldLoadGame){
        if(!(myCanvas instanceof HTMLCanvasElement)) throw new Error(`Unable to find canvas with ${myCanvasID}`);
        if(controls) controls.style.display = 'block';
        if(myCanvas) myCanvas.style.display = 'block';
        if(noGame) noGame.style.display = 'none';  
        const gameCanvas = new GameCanvas(myCanvas);
        gameManager = new GameManager(gameCanvas, debugSettings);
        gameManager.Init();
        window.requestAnimationFrame(gameLoop);
    }
    if(!shouldLoadGame){ 
        if(controls) controls.style.display = 'none';
        if(myCanvas) myCanvas.style.display = 'none';
        if(noGame) noGame.style.display = 'block';        
    }
}

// Confirm if we should still load the game if it looks like the user is on a touch device, as a keyboard is required.
function checkDevice(){
    if (navigator.maxTouchPoints > 1){
        const message = "A keyboard is required to play this game on your device.\nDo you want to still load the game?";
        return confirm(message);
    }
    return true;
}

function gameLoop(timeStamp: number) {
    gameManager.DoGameLoop(timeStamp);
    window.requestAnimationFrame(gameLoop);
}