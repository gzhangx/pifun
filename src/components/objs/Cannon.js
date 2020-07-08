import { Bodies, Vector } from "matter-js";
import { core } from '../thisworld/consts';
import { getProjectionPoint } from "../platform/engine";
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

//will rotate first one
function stickRect2Body({x,y,w,h}, body) {
    const getAngle = ang => !ang ? Math.PI / 2 : ang;
    //const angle = core.utils.getDispAng(getAngle(centerBody.angle));
}

export function showCannonHolder({ c, createdEngine, allBodies }, { x, y }) {
    const { Bounds, Bodies, Matter, rayQueryWithPoints } = createdEngine;
    
    const { 
        HEIGHT,
    } = core.consts;
    const centerPt = rayQueryWithPoints({ x, y: y - w2 }, { x, y: HEIGHT })[0];
    if (!centerPt) return;
    const centerBody = centerPt.body;
    const getAngle = ang => !ang? Math.PI / 2 : ang;    
    const angle = core.utils.getDispAng(getAngle(centerBody.angle));
    const body = Bodies.rectangle(x, y, w, h, {angle});
    for (let i = 0; i < allBodies.length; i++) {
        if (Bounds.contains(body.bounds, { x, y })) {
            const collision = Matter.SAT.collides(body, allBodies[i]);
            if (collision.collided) return;
        }
    }

    const { p1, p2 } = centerPt.edge;
    const projPt = getProjectionPoint(p1, p2, { x, y });
    if (projPt) {
        if (projPt.inRange)
        {            
            c.save();
            c.strokeStyle = '#0000ff';
            c.strokeWeight = 8;
            c.beginPath();
            c.moveTo(x, y);
            c.lineTo(p1.x, p1.y);
            c.moveTo(x, y);
            c.lineTo(p2.x, p2.y);
            c.stroke();
            c.strokeStyle = '#ff00ff';
            c.strokeWeight = 4;
            //c.fill(127);
            c.beginPath();
            c.moveTo(x, y);
            c.lineTo(projPt.x, projPt.y);
            c.stroke();
            c.restore();
            const vc = Vector.sub({ x, y }, projPt);
            const fullLen = Vector.magnitude(vc);
            if (fullLen === 0) return;
            const cr = h2 / fullLen;
            const newC = {
                x: projPt.x + (cr * vc.x),
                y: projPt.y + (cr * vc.y),
            }
            c.save();
            c.translate(newC.x, newC.y);
            c.rotate(angle || 0);
            c.strokeStyle = '#bbb';
            c.strokeWeight = 4;
            //c.fill(127);
            c.beginPath();
            c.rect(-w / 2, -h / 2, w, h);
            c.stroke();
            c.restore();
        }
    }
    
}
