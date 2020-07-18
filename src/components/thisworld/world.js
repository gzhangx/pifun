import SimpleCircle from '../objs/SimpleCircle';
import SimpleRect from '../objs/SimpleRect';

import { core } from './consts';
import { initWorld, getMouse } from './worldConstructor';

import { showCannonHolder, createCannon } from '../objs/Cannon';
import { getDispAng, PId2, createEngine } from '../platform/engine';
import { Vector, Body, Bounds, Mouse } from "matter-js";
import { postRender } from './unitui';

//export const allBodies = [];

const { WIDTH,
    HEIGHT,
    wallWidth,
    halfWallWidth,
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
    //WIDTH,
    //HEIGHT,
    core,
    setup: (canvas, props) => {
        initWorld(core, {
            canvas, run, props,
            renderOpts: {
                showAxes: true,
                hasBounds: true,
                width: WIDTH,
                height: HEIGHT,
                postRender,
                core,
            },
        });
        createWorld();
    },    
};

const screenOff = {
    x: 0,
    y: 0,
}
function run(props) {
    //const { props } = opt;
    const { curBuildType } = core.inputs;
    const { setCurDebugText } = props.inputs;
    const isWallMode = curBuildType === 'wall';
    const isFireMode = curBuildType === 'fire';
    const isCannonMode = curBuildType === 'cannon';
    const isConnection = curBuildType === 'connection';
    const isSelect = curBuildType === 'select';
    const { mouseConstraint } = core;
    
    const mouse = core.states.mouse;
    mouseConstraint.disabled = !isSelect && mouse.pressLocation;
    const now = new Date();
    const { Body, engine, removeFromWorld, rayQuery, rayQueryWithPoints, Vector, Composite } = core.createdEngine;
    const { getDragCellPoints, makeCell, removeBadBodies, worldOperations } = core.worldCon;
    //removeBadBodies();
    //processCollisions(core);
    worldOperations();
    const allBodies = Composite.allBodies(engine.world);


    const c = core.render.context;
    const side = core.inputs.curSide;
    const key = core.inputs.loopKey;    
    
    setCurDebugText("key=" + core.inputs.lastKey + ` bodyCnt=${allBodies.length} cnsts=${Composite.allConstraints(engine.world).length}`);
    

    
    if (key === 'c' || key === 'v') {
        if (key === 'c') screenOff.y+=10;
        if (key === 'v') screenOff.y -= 10;
        core.inputs.loopKey = '';
        doTranslate({
            render: core.render, mouse: engine.mouse, translate: screenOff,
            world: engine.world,
        });
    }
    //if (core.inputs.curBuildType === 'wall') 
    {        
        if (isSelect) {
            doSelect({
                mouseConstraint,
                removeFromWorld,
            });
        }
        showSelect({ isSelect, removeFromWorld, mouseConstraint, setCurDebugText, mouse, key, side});
        if (isCannonMode && mouse.state === 'dragged') {
            showCannonHolder({ c, createdEngine: core.createdEngine, allBodies, setCurDebugText }, {
                x: mouse.cur.x,
                y: mouse.cur.y,
            })
        }
        if (!mouse.pressLocation) return;
        if (!mouse.cur) return;

        if (mouse.state === 'dragged') {
            if (isFireMode || isConnection) {
                
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

                const wallPts = getDragCellPoints(mouse.pressLocation, mouse.cur, endPoints);
                core.uiDspInfo.wallPts = wallPts;
                //drawCellPointsCnv(wallPts);
            }            

        } else if (mouse.state === 'released') {
            mouse.state = '';
            const mouseFrom = getMouse(mouse.pressLocation);
            const mouseCur = getMouse(mouse.cur);
            core.states.mouse.pressLocation = null;
            
            if (isCannonMode) {
                createCannon({ createdEngine: core.createdEngine, allBodies, side }, mouseCur);
            }
            if (isConnection) {
                const bodyA = core.createdEngine.getBodiesUnderPos(mouse.cur);
                if (!bodyA) return;
                const pointA = { x: mouse.cur.x - bodyA.position.x, y: mouse.cur.y - bodyA.position.y };
                const pointB = Vector.sub(mouseFrom, mouseConstraint.body.position);
                core.worldCon.addCst({ bodyB: mouseConstraint.body, bodyA, pointB, pointA});
            }
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
                    core.uiDspInfo.wallPts = wallPts;
                    //drawCellPointsCnv(wallPts);
                    const allWalls = makeCell(wallPts, endPoints, core.worldCats.getCat(side).structure.getCollisionFilter());
                    allWalls.forEach(w => w.health = WALLHEALTH);
                    return allWalls;
                }
            }
        }


    }
    
}

function doSelect({ 
    mouseConstraint,
    removeFromWorld,
}) {
    const key = core.inputs.loopKey;
    if (!core.selectObj.cur) {
        if (mouseConstraint.body) {
            core.selectObj.curBase = mouseConstraint.body;
            core.selectObj.cur = mouseConstraint.body;
            core.selectObj.curInd = -1;
            core.selectObj.curType = 'selbody';
        }
    } else {        
        const body = core.selectObj.curBase;
        if (key === 'a') {
            const curInd = core.selectObj.curInd + 1;
            if (!body.ggConstraints || curInd >= body.ggConstraints.length) {                
                core.selectObj.curBase = mouseConstraint.body;
                core.selectObj.cur = mouseConstraint.body;
                core.selectObj.curInd = -1;
                core.selectObj.curType = 'selbody';
            } else {
                core.selectObj.curInd = curInd;
                core.selectObj.cur = body.ggConstraints[curInd];
                core.selectObj.curType = 'constraint';
            }
        }
    }

    const sel = core.selectObj.cur;
    if (sel && (sel.bodyA || sel.bodyB)) {
        if (key == '1') {
            sel.length++;
        } else if (key == '2'){
            if (sel.length > 0) sel.length--;
        }
    }

    const body = core.selectObj.cur;
    if (body && core.inputs.loopKey === 'Delete') {
        const canDel1 = body.ggInfo && body.ggInfo.player !== 'groundPerm';
        const isCons = body.bodyA || body.bodyB;
        if (canDel1 || isCons) {
            removeFromWorld(body);
        }
        if (mouseConstraint.body === body) {
            mouseConstraint.body = null;
        }
        core.selectObj.cur = null;
        core.selectObj.curInd = -1;
        core.inputs.curKey = '';
    }
}

function showSelect({
    isSelect,
    removeFromWorld,
    mouseConstraint,
    mouse,
    key,
    side,
    setCurDebugText,
}) {
    if (!isSelect) return;
    const body = core.selectObj.cur;
    if (!body) return;
    const c = core.render.context;
    c.beginPath();
    c.strokeStyle = '#00ff00';
    c.strokeWeight = 10;
    c.fillStyle = '#00ff00';
    if (core.selectObj.curType === 'selbody') {
        c.fillRect(body.position.x - 5, body.position.y - 5, 10, 10)
    } else {
        const constraint = body;
        const bodyA = constraint.bodyA,
            bodyB = constraint.bodyB;

        let start, end;

        if (bodyA) {
            start = Vector.add(bodyA.position, constraint.pointA);
        } else {
            start = constraint.pointA;
        }
            
        if (bodyB) {
            end = Vector.add(bodyB.position, constraint.pointB);
        } else {
            end = constraint.pointB;
        }

        c.moveTo(start.x, start.y);
        c.lineTo(end.x + 5, end.y + 5);
        c.lineWidth = 10;
    }
    c.stroke();

    if (mouse.cur) {
        const ggInfo = body.ggInfo;
        if (ggInfo && ggInfo.label === 'Cannon') {
            const part = body.parts[0];
            const p1 = part.vertices[ggInfo.dir[0]];
            const p2 = part.vertices[ggInfo.dir[1]];
            const v = Vector.sub(p2, p1);
            const deg = Math.atan2(v.y, v.x);
            const limitGrad = 15/180* Math.PI;
            
            const bpx = body.position.x;
            const bpy = body.position.y;
            const len = 100;            
            const dovn = (deg, len) => {
                const x = Math.cos(deg) * len;
                const y = Math.sin(deg) * len;
                c.beginPath();
                c.moveTo(bpx, bpy);
                const to = {
                    x: x + bpx,
                    y: y+ bpy,
                }
                c.lineTo(to.x, to.y);
                c.lineWidth = 3;
                c.strokeStyle = "rgba(200, 0, 128, 0.2)";;
                c.stroke();
                return to;
            }
            const degl1 = deg + limitGrad;
            const degl2 = deg - limitGrad;            
            const to2 = dovn(degl1, len);
            const to1 = dovn(degl2, len);
            const diry = mouse.cur.y - bpy;
            const dirx = mouse.cur.x - bpx;
            const mdeg = Math.atan2(diry, dirx);
            //setCurDebugText(`dirxy=${dirx.toFixed(0)} ${diry.toFixed(0)}`);
            if (mdeg >= degl2 && mdeg <= degl1)
            {
                //dovn(mdeg, len);
                if (key === 'z') {
                    const ball = new SimpleCircle({
                        x: bpx,
                        y: bpy,
                        r: 10,
                        label: 'fireball',
                        opts: { restitution: 0.5, collisionFilter: core.worldCats.getCat(side).fire.getCollisionFilter() },
                        ggOpts: { label: 'fireball', time: new Date(), side },
                    }, core.createdEngine);
                    const bbody = ball.body;
                    //bbody.label = 'fireball';
                    const forceMagnitude = bbody.mass * 0.05;
                    {
                        Body.applyForce(bbody, bbody.position, {
                            x: forceMagnitude * dirx * 0.01,
                            y: forceMagnitude * diry * 0.01,
                        });
                    }
                }
                c.beginPath();
                c.lineWidth = 3;
                c.strokeStyle = "000";
                c.moveTo(bpx, bpy);
                c.lineTo(dirx + bpx, diry + bpy);
                c.stroke();
            }
            c.beginPath();
            c.fillStyle = "rgba(255, 0, 128, 0.2)";
            c.moveTo(bpx, bpy);
            c.lineTo(to1.x ,to1.y);
            c.arc(bpx, bpy, len, degl2, degl1)
            c.lineTo(bpx, bpy);
            c.fill();
            c.stroke();


            
        }
    }
}


function doTranslate({ render, mouse, translate, world }) {    

    // prevent the view moving outside the world bounds
    if (render.bounds.min.x + translate.x < world.bounds.min.x)
        translate.x = world.bounds.min.x - render.bounds.min.x;

    if (render.bounds.max.x + translate.x > world.bounds.max.x)
        translate.x = world.bounds.max.x - render.bounds.max.x;

    if (render.bounds.min.y + translate.y < world.bounds.min.y)
        translate.y = world.bounds.min.y - render.bounds.min.y;

    if (render.bounds.max.y + translate.y > world.bounds.max.y)
        translate.y = world.bounds.max.y - render.bounds.max.y;

    // move the view
    Bounds.translate(render.bounds, translate);

    // we must update the mouse too
    Mouse.setOffset(mouse, render.bounds.min);
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
            player: 'groundPerm'
        },
        opts: { isStatic: true, label: 'Ground', collisionFilter: worldCats.ground.structure.getCollisionFilter()},
    }, createdEngine);


    //addToWorld([
    //  // walls      
    //  Bodies.rectangle(WIDTH/2, HEIGHT, WIDTH, 60, { isStatic: true })
    //])
}