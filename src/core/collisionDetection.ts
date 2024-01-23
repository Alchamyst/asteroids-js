import GameObject from "./gameObject";
import PhysicsObject from "./physicsObject";

import Asteroid from "../gameEntities/asteroid";
import Bullet from "../gameEntities/bullet";
import Ship from "../gameEntities/ship";


export const detectCollisions = (gameObjects: Array<GameObject>) => {
    let obj1;
    let obj2;

    // Reset collision state for all PhysicsObjects.
    for(let i=0; i < gameObjects.length; i++) {
        const object = gameObjects[i];
        if(object instanceof PhysicsObject){
            object.SetColliding(false); 
        }
    }

    // Check Physics objects for Collisions
    for (let i = gameObjects.length -1; i >= 0; i--){
        obj1 = gameObjects[i];

        if (obj1 instanceof PhysicsObject){
            for (let j = gameObjects.length - 1; j >= 0; j--){
                obj2 = gameObjects[j];
                
                if (obj2 instanceof PhysicsObject && i !==j){
                    if(circleIntersect(obj1.x, obj1.y, obj1.GetCollisionRadius(), obj2.x, obj2.y, obj2.GetCollisionRadius())){

                        // Don't treat bullets as colliding with ship.
                        if ((obj1 instanceof Bullet || obj2 instanceof Bullet) && (obj1 instanceof Ship || obj2 instanceof Ship)) return;

                        obj1.SetColliding(true);
                        obj2.SetColliding(true);
                        // gameObject()
                        if ((obj1 instanceof Bullet || obj2 instanceof Bullet) && (obj1 instanceof Asteroid || obj2 instanceof Asteroid)){
                            if(obj1 instanceof Asteroid && obj2 instanceof Bullet) {
                                obj2.Remove();
                                obj1.ScoredHit(); 
                            }

                            if(obj2 instanceof Asteroid && obj1 instanceof Bullet) {
                                obj1.Remove();
                                obj2.ScoredHit();
                            }
                        }
                    }
                }
            }
        }
    }
}

function circleIntersect(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number){
    // Calculate the distance between the two circles
    let squareDistance = (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);

    // When the distance is smaller or equal to the sum of the two radius, the circles touch or overlap
    return squareDistance <= ((r1 + r2) * (r1 + r2))
}