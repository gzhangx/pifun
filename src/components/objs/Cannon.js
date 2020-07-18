import { Vector } from "matter-js";
//import { core, WIDTH } from '../thisworld/consts';
import SimpleRect from './SimpleRect';
import { stickRect2Body } from "../platform/engine";
const w = 100;
const h = 20;


function getCloserBody(from, bodies) {
    return bodies.reduce((acc, bdy) => {
        if (bdy) {
            const pos = bdy.body.position;
            const dx = from.x - pos.x;
            const dy = from.y - pos.y;
            const dst2 = dx * dx + dy * dy;
            if (!acc.body || acc.dist > dst2) {
                acc.dist = dst2;
                acc.body = bdy;
            }
        }
        return acc;
    }, {
        body: null,
        dist: 0,
    }).body;
}
function queryCannonPos({ core, allBodies, setCurDebugText }, from) {
    const { createdEngine, consts } = core;
    const { WIDTH, HEIGHT } = consts;
    const { x, y } = from;
    const { Bodies, Matter, rayQueryWithPoints } = createdEngine;
    
    const centerPtBtm = rayQueryWithPoints(from, { x, y: HEIGHT })[0];
    const centerPtTop = rayQueryWithPoints(from, { x, y: 0 })[0];
    const centerPtRight = rayQueryWithPoints(from, { x: WIDTH, y })[0];
    const centerPtLeft = rayQueryWithPoints(from, { x: 0, y })[0];
    const centerPt = getCloserBody(from, [centerPtBtm, centerPtTop, centerPtRight, centerPtLeft]);
    if (!centerPt) return;
    const rrr = stickRect2Body({ x, y, w, h }, centerPt.body);
    if (!rrr) return;
    const { newC } = rrr;
    const angle = newC.angle;
    const body = Bodies.rectangle(newC.x, newC.y, w-1, h-1, { angle });
    body.ggInfo = { h };
    if (setCurDebugText)
        setCurDebugText(`allBodies ${allBodies.length}`);
    for (let i = 0; i < allBodies.length; i++) {
        //if (Bounds.contains(body.bounds, { x, y }))        
        const collision = Matter.SAT.collides(body, allBodies[i]);        
        if (collision.collided) return;        
    }
        
    //if (rrr) rrr.newC.angle = angle;
    return rrr;
}

export function createCannon(opt, pos) {
    const rrr = queryCannonPos(opt, pos);
    if (!rrr) return;
    const core = opt.core;
    const { newC } = rrr; //{ x: projPt.x + (cr * vc.x), y: projPt.y + (cr * vc.y),}
    const angle = newC.angle;
    const { side } = opt;
    const { createdEngine } = core;
    const rc = new SimpleRect({
        x: newC.x,
        y: newC.y,
        w,
        h,
        ggOpts: {
            label: 'Cannon',
            h,
            dir: [0, 1] //from body.parts[0].vertices[a].x = b.x
        },
        opts: { angle, restitution: 0.5, collisionFilter: core.worldCats.getCat(side).structure.getCollisionFilter() },    
    }, createdEngine);

    const stiffness = 0.9;
    const getCst = who => {
        return { bodyA: rrr.body, bodyB: rc.body, pointA: Vector.sub(rrr.goodPts[who], rrr.body.position), pointB: Vector.sub(rrr.goodPts[who], rc.body.position), stiffness };
    };
    core.worldCon.addCst(getCst(0));
    core.worldCon.addCst(getCst(1));
}

export function showCannonHolder(opt, { x, y }) {
    const rrr = queryCannonPos(opt, { x, y });
    if (!rrr) return;    
    const projPt = rrr.projPt; //getProjectionPoint(p1, p2, { x, y });
    if (projPt) {
        if (projPt.inRange)
        {
            return {
                cannonInfo: rrr,
                x,
                y,
                w,
                h,
            }            
        }
    }
    
}
