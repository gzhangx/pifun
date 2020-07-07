import { Bodies } from "matter-js";
import { core } from '../thisworld/consts';
const w = 100;
const h = 20;
const w2 = w / 2;
const h2 = h / 2;

export function createCannon(engine, { x, y, opts, ggOpts }) {    
    const { World, world, Bodies } = engine;
    const body = Bodies.rectangle(x, y, w, h, opts);    
    World.add(world, body);
    engine.setBodyOuterParent(body, Object.assign({}, ggOpts));    
}

export function showCannonHolder({ c, createdEngine, allBodies }, { x, y }) {
    const { Bounds, Bodies, Matter, rayQueryWithPoints } = createdEngine;
    
    const { 
        HEIGHT,
    } = core.consts;
    const centerPt = rayQueryWithPoints({ x, y: y - w2 }, { x, y: HEIGHT })[0];
    if (!centerPt) return;
    const centerBody = centerPt.body;
    const angle = core.utils.getDispAng(centerBody.angle);
    const body = Bodies.rectangle(x, y, w, h, {angle});
    for (let i = 0; i < allBodies.length; i++) {
        if (Bounds.contains(body.bounds, { x, y })) {
            const collision = Matter.SAT.collides(body, allBodies[i]);
            if (collision.collided) return;
        }
    }
    c.save();
    c.translate(x, y);
    c.rotate(angle || 0);    
    c.strokeStyle = '#bbb';
    c.strokeWeight = 4;
    //c.fill(127);
    c.beginPath();
    c.rect(-w/2, -h/2, w, h);
    c.stroke();
    c.restore();
}
