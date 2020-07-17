import { Bodies, Vector } from "matter-js";
import { core, WIDTH } from '../thisworld/consts';
import SimpleRect from './SimpleRect';
import { getProjectionPoint, rayQueryOnOneBody, stickRect2Body, getDispAng, createEngine } from "../platform/engine";
const w = 100;
const h = 20;
const w2 = w / 2;
const h2 = h / 2;

export function createCannonOld(engine, { x, y, opts, ggOpts }) {    
    const { World, world, Bodies } = engine;
    const body = Bodies.rectangle(x, y, w, h, opts);    
    World.add(world, body);
    engine.setBodyOuterParent(body, Object.assign({}, ggOpts));    
}


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
function queryCannonPos({ createdEngine, allBodies, setCurDebugText }, from) {
    const { x, y } = from;
    const { Bounds, Bodies, Matter, rayQueryWithPoints } = createdEngine;
    const {
        HEIGHT,
    } = core.consts;
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
        {
            const collision = Matter.SAT.collides(body, allBodies[i]);
            //const bi = allBodies[i];
            //if (bi.ggInfo && bi.ggInfo.label === 'Cannon') {
            //    const collision2 = Matter.SAT.collides(body, bi);
            //    if (setCurDebugText)
            //        setCurDebugText(`found cannon allBodies ${allBodies.length} ${collision.collided} ${x} ${y}- ${bi.position.x.toFixed(0)} ${bi.position.y.toFixed(0)}`);
            //}
            if (collision.collided) return;
        }
    }
        
    //if (rrr) rrr.newC.angle = angle;
    return rrr;
}

export function createCannon(opt, pos) {
    const rrr = queryCannonPos(opt, pos);
    if (!rrr) return;
    const { newC, fromEnd1, fromEnd2, goodPts } = rrr; //{ x: projPt.x + (cr * vc.x), y: projPt.y + (cr * vc.y),}
    const angle = newC.angle;
    const { createdEngine, side } = opt;
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
    const { c, createdEngine, allBodies } = opt;
    const { p1, p2 } = rrr.queryInfo.edge;
    const projPt = rrr.projPt; //getProjectionPoint(p1, p2, { x, y });
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
            c.strokeStyle = '#0000ff';
            c.strokeWeight = 4;
            //c.fill(127);
            c.beginPath();
            c.moveTo(x, y);
            c.lineTo(projPt.x, projPt.y);
            c.stroke();
            c.restore();

            const { newC, fromEnd1, fromEnd2, goodPts } = rrr; //{ x: projPt.x + (cr * vc.x), y: projPt.y + (cr * vc.y),}
            const angle = newC.angle;
            c.beginPath();
            c.strokeStyle = '#bbb';
            c.strokeWeight = 4;
            c.beginPath();
            c.arc(fromEnd1.x, fromEnd1.y, 10, 0, 2 * Math.PI);
            c.stroke();
            c.strokeStyle = '#222';
            c.beginPath();
            c.arc(fromEnd2.x, fromEnd2.y, 10, 0, 2 * Math.PI);            
            c.stroke();
            c.save();            
            c.translate(newC.x, newC.y);
            c.rotate(angle || 0);
            c.strokeStyle = '#bbb';
            c.strokeWeight = 4;
            //c.fill(127);
            c.beginPath();
            c.strokeStyle = '#222222';
            c.fillStyle = '#222222';
            c.fillText(((angle/Math.PI)*180).toFixed(0),0,0);
            c.rect(-w / 2, -h / 2, w, h);
            c.stroke();
            
            c.restore();
            c.save();
            c.beginPath();
            c.strokeStyle = '#bbb';
            c.strokeWeight = 4;
            //c.translate(fromEnd1.x, fromEnd1.y);
            c.beginPath();
            c.rect(fromEnd1.x - 5, fromEnd1.y - 5, 10, 10);
            c.stroke();
            c.beginPath();
            c.rect(fromEnd2.x - 5, fromEnd2.y - 5, 10, 10);
            c.stroke();
            const colors = ['#ff0000', '#00ff00','#0000ff','#ffaaff']
            goodPts.map((pt, i) => {
                const size = 20 - i*3;
                c.beginPath();
                c.strokeStyle = colors[i];
                c.rect(pt.x - (size/2), pt.y - (size/2), size, size);
                c.stroke();
            })            
            c.restore();
        }
    }
    
}
