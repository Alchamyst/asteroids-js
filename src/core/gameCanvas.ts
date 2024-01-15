export default class GameCanvas {
    private canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement){
        this.canvas = canvas;
        this.canvas.width = 1200;
        this.canvas.height = 800;

        const context = canvas.getContext('2d');
        if(!(context instanceof CanvasRenderingContext2D)) throw new Error(`Unable to getContext of canvas.`);
        this.ctx = context;
    }
    GetCanvas(){
        return this.canvas;
    }
    GetCtx(){
        return this.ctx;
    }
    ClearScreen(){
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height); 
    }
}