import Particle from "../core/particle";
import GameObject from "../core/gameObject";

export class Explosion extends GameObject {
    private particles: Array<Particle>;
    private colors: Array<string>;
    private particleCount: number;
    private particleSize: number;
    private particleLifespan: number;

    // Definition needs importing to handle ' gameManager: GameManager '
    constructor(context: any, gameManager: any, x: number, y: number, particleCount = 10, particleSize = 1, colors = ['white'], particleLifespan: number) {
        super(context, gameManager, x, y)
        this.particles = [];
        this.colors = colors;
        this.particleCount = particleCount;
        this.particleSize = particleSize;
        this.particleLifespan = particleLifespan

        for (let i = 0; i < this.particleCount; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const speed = Math.random() * 500 + 100;
            const velocityX = speed * Math.cos(angle);
            const velocityY = speed * Math.sin(angle);
            const particleColor = this.colors[Math.floor(Math.random() * this.colors.length)];
            const particle = new Particle(this.ctx, this.gameManager, this.x, y, particleColor, velocityX, velocityY, this.particleSize, this.particleLifespan);
            this.particles.push(particle);
        }
    }
    Update(secondsPassed: number) {
        for (const particle of this.particles) {
            particle.Update(secondsPassed);
        }
        this.particles = this.particles.filter((particle) => particle.GetAlpha() > 0);

        if(this.particles.length == 0){
            this.gameManager.RemoveGameObject(this);
        }
    }
    Render() {
        for (const particle of this.particles) {
            particle.Render();
        }
    }
}

export class ShipExplosion extends Explosion {
    // Definition needs importing to handle ' gameManager: GameManager '
    constructor(context: any, gameManager: any, x: number, y: number){
        const particleCount = 50;
        const particleSize = 1.5;
        const lifespan = 2;
        const colors = [
            'white',
            'white',
            'white',
            'white',
            'red',
            'pink',
            'rgba(0, 255, 255, 1)' // Shield color.
        ]
        super(context, gameManager, x, y, particleCount, particleSize, colors, lifespan);
    }
}

export class JetEmitter extends GameObject {
    private particles: Array<Particle>;
    private shouldEmit: boolean;
    private particlesPerSec: number;
    private particleSize: number;
    private particleColor: string;
    private particleLifespan: number;
    private particleSpeedMultiplier: number;
    private velX: number;
    private velY: number;

    // Definition needs importing to handle ' gameManager: GameManager '
    constructor(context: any, gameManager: any, x: number, y: number) {
        super(context, gameManager, x, y)
        this.particles = [];
        this.shouldEmit = false;
        this.particlesPerSec = 255;
        this.particleSize = 2;
        this.particleColor = 'orange';
        this.particleLifespan = 0.1;
        this.particleSpeedMultiplier = 0.25;
        this.velX = 0;
        this.velY = 0;
    }
    StartEmitting(){
        this.shouldEmit = true;
    }
    StopEmitting(){
        this.shouldEmit = false;
    }
    SetLocation(x: number, y: number, velX: number, velY: number){
        this.x = x;
        this.y = y;
        this.velX = velX;
        this.velY = velY;
    }
    Update(secondsPassed: number) {
        if(this.shouldEmit){
            const particlesQty = Math.floor(this.particlesPerSec * secondsPassed); // This is affecting quality!
            for (let i = 0; i < particlesQty ; i++) {
                // const velocityX = this.velX;
                // const velocityY = this.velY; 
                const particle = new Particle(this.ctx, this.gameManager, this.x, this.y, this.particleColor, this.velX * this.particleSpeedMultiplier, this.velY * this.particleSpeedMultiplier, this.particleSize, this.particleLifespan);
                this.particles.push(particle);
            }
        }
        for (const particle of this.particles) {
            particle.Update(secondsPassed);
        }
        this.particles = this.particles.filter((particle) => particle.GetAlpha() > 0);
    }
    Render() {
        for (const particle of this.particles) {
            particle.Render();
        }
    }
}