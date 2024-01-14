export default class InputManager {
    private actions;

    constructor(){
        this.actions = {
            leftButton: false,
            rightButton: false,
            forwardButton: false,
            fireButton: false,
            startButton: false
        }
        document.body.addEventListener("keydown", (e) => {this.KeyDown(e.keyCode)});
        document.body.addEventListener("keyup", (e) => {this.KeyUp(e.keyCode)});
    }
    KeyDown(keyCode: number){
        if(keyCode === 38 || keyCode == 87) this.actions.forwardButton = true; // UpArrow or W key pressed.
        if(keyCode === 37 || keyCode == 65) this.actions.leftButton = true; // LeftArrow or A key pressed.
        if(keyCode === 39 || keyCode == 68) this.actions.rightButton = true; // RightArrow or D key pressed.
        if(keyCode === 32) this.actions.fireButton = true; // Spacebar key pressed.
        if(keyCode === 13) this.actions.startButton = true; // Enter key pressed.
    }
    KeyUp(keyCode: number){
        if(keyCode === 38 || keyCode === 87) this.actions.forwardButton = false; // UpArrow or W key pressed.
        if(keyCode === 37 || keyCode === 65) this.actions.leftButton = false; // LeftArrow or A key pressed.   
        if(keyCode === 39 || keyCode === 68) this.actions.rightButton = false; // RightArrow or D key pressed.
        if(keyCode === 32) this.actions.fireButton = false; // Spacebar key pressed.
        if(keyCode === 13) this.actions.startButton = false; // Enter key pressed.
    }
    GetCurrentActions(){
        return this.actions;
    }
}