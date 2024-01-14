export default class GameObject {
    ctx: CanvasRenderingContext2D;
    x: number;
    y: number;

    constructor(ctx: CanvasRenderingContext2D, x: number, y: number){
        this.ctx = ctx;
        this.x = x;
        this.y = y;
    }
    Update(secondsPassed: number){
    }
    Render(){
    }
}