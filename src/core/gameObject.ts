export default class GameObject {
    ctx: any; // To Be Defined...
    x: number;
    y: number;

    constructor(ctx: any, x: number, y: number){
        this.ctx = ctx;
        this.x = x;
        this.y = y;
    }
    Update(secondsPassed: number){
    }
    Render(){
    }
}