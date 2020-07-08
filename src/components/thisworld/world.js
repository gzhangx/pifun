import SimpleCircle from '../objs/SimpleCircle';
import SimpleRect from '../objs/SimpleRect';

import { core } from './consts';
import { initWorld, getMouse } from './worldConstructor';

import { createRender } from './ui';
import { showCannonHolder } from '../objs/Cannon';
 
//export const allBodies = [];

const { WIDTH,
    HEIGHT,
    wallWidth,
    halfWallWidth,
    PId2,
    WALLHEALTH,
    BREAKAWAYSPEED,
    BREAKAWAYANGSPEED, } = core.consts;

function doWallSketch(fromPt, cur) {
    const {rayQueryWithPoints} = core.createdEngine;
    const startPt = rayQueryWithPoints({x:fromPt.x, y:fromPt.y},{x: fromPt.x, y: HEIGHT});
    startPt.forEach(r=>{                        
        //props.inputs[`setCurCollisionStart`](`${r.x.toFixed(2)}/${r.y.toFixed(2)} `);
        //p.push();
        //p.translate(r.x, r.y);
        //p.text(r.t.toFixed(2), 0,0);        
        //p.rectMode(p.CENTER);
        //p.stroke('ff0000');
        //p.strokeWeight(2);
        //p.fill('0000ff');                    
        //p.rect(2,2, 4, 4);
        //p.pop();
    });

    const endpt = rayQueryWithPoints({x:cur.x, y:cur.y},{x: cur.x, y: HEIGHT});
    const start = startPt[0];
    return {
        ok: Math.abs(cur.x - fromPt.x) > wallWidth * 2 && start,
        start,
        end: endpt[0],
    }
}

const dbgfmtPt = (p, fixed = 0) => p ? `(${p.x.toFixed(fixed)}/${p.y.toFixed(0)})` : 'NA';
const fmt2Int = p => parseInt(p);
export default  {
    WIDTH,
    HEIGHT,
    core,
    setup: (canvas, props) => {
        initWorld(core, { canvas, run, props });
        createWorld();
    },    
};

function run(props) {
    //const { props } = opt;
    const { curBuildType } = core.inputs;
    const { setCurDebugText } = props.inputs;
    const isWallMode = curBuildType === 'wall';
    const isFireMode = curBuildType === 'fire';
    const isCannonMode = curBuildType === 'cannon';
    const now = new Date();
    const { Body, engine, removeFromWorld, rayQuery, rayQueryWithPoints, Vector, Composite } = core.createdEngine;
    const { getDragCellPoints, makeCell, removeBadBodies, worldOperations } = core.worldCon;
    //removeBadBodies();
    //processCollisions(core);
    worldOperations();
    const allBodies = Composite.allBodies(engine.world);


    const c = core.render.context;
    const side = core.inputs.curSide;
    
    setCurDebugText("key=" + core.inputs.curKey);
    


    //if (core.inputs.curBuildType === 'wall') 
    {
        const mouse = core.states.mouse;

        if (isCannonMode && mouse.state === 'dragged') {
            showCannonHolder({ c, createdEngine: core.createdEngine, allBodies }, {
                x: mouse.cur.x,
                y: mouse.cur.y,
            })
        }
        if (!mouse.pressLocation) return;
        if (!mouse.cur) return;


        const drawCellPointsCnv = connects => {
            const p = core.render.context;
            connects.reduce((acc, c) => {
                const showRect = (rr, stroke = '#ff0000', fill = '#0000ff') => {
                    p.save();
                    p.translate(rr.x, rr.y);
                    p.rotate((rr.angle || 0) + PId2);
                    //p.stroke(stroke);
                    //p.strokeWeight(2);
                    //p.fill(fill);
                    p.fillStyle = fill;
                    p.fillRect(-(rr.w / 2), -(rr.h / 2), rr.w, rr.h);
                    p.restore();
                };

                const chkshow = a => {
                    if (acc[a.id]) return;
                    acc[a.id] = a;
                    showRect(a);
                }
                const { a, b } = c;
                chkshow(a);
                chkshow(b);

                const { pointA, pointB } = c;
                p.save();
                //p.stroke('#00ff00');
                //p.strokeWeight(2);
                const xa = pointA.x + a.x;
                const ya = pointA.y + a.y;
                const xb = pointB.x + b.x;
                const yb = pointB.y + b.y;
                //p.line(xa, ya, xb, yb);
                showRect(Object.assign({}, a, { w: 20, h: 20 }), '#223344', '#0000ff');
                //showRect({ x: a.x + pointA.x, y: a.y + pointA.y, w: 10, h: 10 }, '#223344', '#00ff00');
                //showRect({ x: b.x + pointB.x + 10, y: b.y + pointB.y, w: 10, h: 10 }, '#223344', '#ff0000');
                //setCurDebugText(`debugremove ===> ${dbgfmtPt(mouse.cur)} ax=${dbgfmtPt(a)} da=${dbgfmtPt(pointA)} bx is ${dbgfmtPt(b)} db=da=${dbgfmtPt(pointB)}`);
                //p.line(xa, ya, xb, yb);

                p.restore();
                return acc;
            }, {});
        }


        if (mouse.state === 'dragged') {
            if (isFireMode) {
                
                c.lineWidth = 5;
                c.strokeStyle = 'red';
                core.render.line(mouse.pressLocation, mouse.cur);
                //p.stroke(128);
                //p.strokeWeight(2);
                //p.line(mouse.pressLocation.x, mouse.pressLocation.y, mouse.cur.x, mouse.cur.y);
            }

            if (isWallMode) {
                const res = rayQueryWithPoints({ x: mouse.pressLocation.x, y: mouse.pressLocation.y }, { x: mouse.cur.x, y: mouse.cur.y });
                res.forEach(r => {
                    //props.inputs[`setCurCollisionStart`](`${r.x.toFixed(2)}/${r.y.toFixed(2)} `);
                    //p.push();
                    //p.translate(r.x, r.y);
                    //p.text(r.t.toFixed(2), 0,0);        
                    //p.rectMode(p.CENTER);
                    //p.stroke('#ff0000');
                    //p.strokeWeight(2);
                    //p.fill('#0000ff');                    
                    //p.rect(2,2, 4, 4);
                    //p.pop();                        
                });

                //props.inputs[`setCurCollisionStart`](`${dists} `);                    
                const endPoints = doWallSketch(mouse.pressLocation, mouse.cur);
                if (!endPoints.ok || !endPoints.end) return;

                const wallPts = getDragCellPoints(mouse.pressLocation, mouse.cur,endPoints);
                drawCellPointsCnv(wallPts);
            }            

        } else if (mouse.state === 'released') {
            mouse.state = '';
            const mouseFrom = getMouse(mouse.pressLocation);
            const mouseCur = getMouse(mouse.cur);
            core.states.mouse.pressLocation = null;
            if (isFireMode) {
                if (!mouseFrom) return;
                const x1 = mouseCur.x;
                const y1 = mouseCur.y;
                const x2 = mouseFrom.x;
                const y2 = mouseFrom.y;                
                const ball = new SimpleCircle({
                    x: x2,
                    y: y2,
                    r: 10,
                    label: 'fireball',
                    opts: { restitution: 0.5, collisionFilter: core.worldCats.getCat(side).fire.getCollisionFilter() },
                    ggOpts: { label: 'fireball', time: new Date(), side},
                }, core.createdEngine);
                const bbody = ball.body;
                bbody.label = 'fireball';
                const forceMagnitude = bbody.mass * 0.05;
                const xx = x1 - x2;
                const yy = y1 - y2;
                if (Math.abs(xx) + Math.abs(yy) > 0) {
                    Body.applyForce(bbody, bbody.position, {
                        x: forceMagnitude * xx * 0.01,
                        y: forceMagnitude * yy * 0.01,
                    });
                }
                return;
            }

            if (isWallMode) {
                const endPoints = doWallSketch(mouseFrom, mouseCur);
                if (!endPoints.ok || !endPoints.end) return;
                const wallPts = getDragCellPoints(mouseFrom, mouseCur,endPoints);                
                if (wallPts && wallPts.length) {                    
                    drawCellPointsCnv(wallPts);
                    const allWalls = makeCell(wallPts, endPoints, core.worldCats.getCat(side).structure.getCollisionFilter());
                    allWalls.forEach(w => w.health = WALLHEALTH);
                    return allWalls;
                }
            }
        }


    }
}

function createWorld() {

    //(categoryA & maskB) !== 0 and (categoryB & maskA) !== 0    
    //const { addToWorld, Bodies, Body } = core.createdEngine;
    const { worldCats, createdEngine } = core;    
    
    new SimpleCircle({
        x: 210,
        y: 100,
        r: 30,
        ggOpts: {
            isImmortal: true,
        },
        opts: { restitution: 0.5, collisionFilter: worldCats.ground.structure.getCollisionFilter()},
    }, createdEngine);

    new SimpleRect({
        x: 310,
        y: 100,
        w: 30,
        h: 60,
        ggOpts: {
            isImmortal: true,
            h: 60,
        },
        opts: { restitution: 0.5, collisionFilter: worldCats.ground.structure.getCollisionFilter()},
    }, createdEngine);
    
    const GroundHeight = 200;
    new SimpleRect({
        x: WIDTH/2,
        y: HEIGHT + GroundHeight/2- 10,
        w: WIDTH,
        h: GroundHeight,
        ggOpts: {
            isImmortal: true,
            h: GroundHeight,
        },
        opts: { isStatic: true, label: 'Ground', collisionFilter: worldCats.ground.structure.getCollisionFilter()},
    }, createdEngine);


    //addToWorld([
    //  // walls      
    //  Bodies.rectangle(WIDTH/2, HEIGHT, WIDTH, 60, { isStatic: true })
    //])
}