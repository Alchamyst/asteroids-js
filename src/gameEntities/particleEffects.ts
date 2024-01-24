import GameCanvas from "../core/gameCanvas";
import GameManager from "./gameManager";
import GameObject from "../core/gameObject";
import Particle from "../core/particle";

export class Explosion extends GameObject {
    private particles: Array<Particle>;
    private colors: Array<string>;
    private particleCount: number;
    private particleSize: number;
    private particleLifespan: number;

    constructor(gameCanvas: GameCanvas, gameManager: GameManager, x: number, y: number, particleCount = 10, particleSize = 1, colors = ['white'], particleLifespan: number) {
        super(gameCanvas, gameManager, x, y)
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
            const particle = new Particle(this.gameCanvas, this.gameManager, this.x, y, particleColor, velocityX, velocityY, this.particleSize, this.particleLifespan);
            this.particles.push(particle);
        }
        console.log('Constructor called for Explosion.');
    }
    Update(secondsPassed: number) {
        console.log('Update method called for Explosion.');
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
    constructor(gameCanvas: GameCanvas, gameManager: GameManager, x: number, y: number){
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
        super(gameCanvas, gameManager, x, y, particleCount, particleSize, colors, lifespan);
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

    constructor(gameCanvas: GameCanvas, gameManager: GameManager, x: number, y: number) {
        super(gameCanvas, gameManager, x, y)
        this.particles = [];
        this.shouldEmit = false;
        this.particlesPerSec = 255; // This is affecting quality of the explosion.
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
            const particlesQty = Math.floor(this.particlesPerSec * secondsPassed); 
            for (let i = 0; i < particlesQty ; i++) {
                const particle = new Particle(this.gameCanvas, this.gameManager, this.x, this.y, this.particleColor, this.velX * this.particleSpeedMultiplier, this.velY * this.particleSpeedMultiplier, this.particleSize, this.particleLifespan);
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