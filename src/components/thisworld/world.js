import SimpleCircle from '../objs/SimpleCircle';
import SimpleSqure from '../objs/SimpleSqure';
import SimpleRect from '../objs/SimpleRect';
import { World } from 'matter-js';
import { createConstructor, initCats } from './worldConstructor';

//export const allBodies = [];
export const WIDTH = 600;
export const HEIGHT = 600;
const WALLHEALTH = 10;
const BREAKAWAYSPEED = 10;
const BREAKAWAYANGSPEED = 0.3;
const wallWidth = 20;
const halfWallWidth = wallWidth / 10;
const PId2 = -Math.PI / 2
const dbgfmtPt = (p, fixed = 0) => p ? `(${p.x.toFixed(fixed)}/${p.y.toFixed(0)})` : 'NA';
const fmt2Int = p => parseInt(p);

const core = {
    consts: {
        WIDTH,
        HEIGHT,
        wallWidth,
        halfWallWidth,
        PId2,
        WALLHEALTH,
        BREAKAWAYSPEED,
        BREAKAWAYANGSPEED,
    },
    createdEngine: null,
    //allBodies,
    //constraints: [],
    collisions:[],
    collisionEvent: {},
    states: {
        mouse: {        
            state: '',
            pressLocation: {
                x:0,
                y:0,
            },
            cur: {
                x:0,
                y:0,
            }
        }
    },
    inputs: {
        curKey: '',
        curBuildType: '',
    },
    //https://github.com/liabru/matter-js/blob/5f5b8a1f279736b121231a41181621b86253ea1c/src/body/Body.js#L1040
    worldCats: {        
        ground: {
            structure: {
                category: 0,
                mask: 0,
                getCollisionFilter: null,
            },            
        },
        c1: {
            structure: {
                category: 0,
                mask: 0,
                getCollisionFilter: null,
            },
            fire: {
                category: 0,
                mask: 0,
                getCollisionFilter: null,
            },
        },
        c2: {
            structure: {
                category: 0,
                mask: 0,
                getCollisionFilter: null,
            },
            fire: {
                category: 0,
                mask: 0,
                getCollisionFilter: null,
            },
        },
    },
    
    deepCurCollisions: {},
    debugInfo: null,
}

let createdEngine;
let worldCon;


const debugDeepCollisions = [];

function doWallSketch(mouse, p) {
    const {rayQueryWithPoints} = createdEngine;
    const startPt = rayQueryWithPoints({x:mouse.pressLocation.x, y:mouse.pressLocation.y},{x: mouse.pressLocation.x, y: HEIGHT});
    startPt.forEach(r=>{                        
        //props.inputs[`setCurCollisionStart`](`${r.x.toFixed(2)}/${r.y.toFixed(2)} `);
        p.push();
        p.translate(r.x, r.y);
        p.text(r.t.toFixed(2), 0,0);        
        p.rectMode(p.CENTER);
        p.stroke('ff0000');
        p.strokeWeight(2);
        p.fill('0000ff');                    
        p.rect(2,2, 4, 4);
        p.pop();
    });

    const endpt = rayQueryWithPoints({x:mouse.cur.x, y:mouse.cur.y},{x: mouse.cur.x, y: HEIGHT});
    endpt.forEach(r=>{                        
        //props.inputs[`setCurCollisionStart`](`${r.x.toFixed(2)}/${r.y.toFixed(2)} `);
        p.push();
        p.translate(r.x, r.y);
        p.text(r.t.toFixed(2), 0,0);        
        p.rectMode(p.CENTER);
        p.stroke('ff0000');
        p.strokeWeight(2);
        p.fill('0000ff');                    
        p.rect(2,2, 4, 4);
        p.pop();                        
    });

    const start = startPt[0];
    return {
        ok: Math.abs(mouse.cur.x - mouse.pressLocation.x) > wallWidth * 2 && start,
        start,
        end: endpt[0],
    }
}

const getConstraintOffset = (op, obj) => {
    const { angle, h } = obj;
    const hh = h / 2;

    let addAng = 0;
    if (op === '-') {
        addAng = Math.PI;
    }
    const x = Math.cos(angle + addAng) * hh;
    const y = Math.sin(angle + addAng) * hh;

    return { x, y };
};

export default  {
    WIDTH,
    HEIGHT,
    core,
    setup: (p, engineCreated, canvas)=>{
        const convas = p.createCanvas(WIDTH, HEIGHT);
        convas.parent('p5-parent');
        createdEngine = engineCreated;
        core.createdEngine = engineCreated;        
        const {Mouse, MouseConstraint} = createdEngine.Matter;
        createdEngine.eventCallbacks.collisionEvent = (e)=>{            
            core.collisionEvent = e;
            if (e.name === 'collisionActive' || e.pairs.length) {
                //core.collisions = e.pairs;
            }
            if (e.name === 'collisionStart') {
                //console.log('collisionStart ' + e.pairs.length);
                //console.log(e.source.pairs.list);
                core.collisions = e.pairs;
            }
            if (e.name === 'collisionEnd') {
                //console.log('collisionEnd' + e.source.pairs.list.length);
                //console.log(e);
            }
        };
        const mouse = Mouse.create(canvas),        
        mouseConstraint = MouseConstraint.create(createdEngine.engine, {
            mouse,
            constraint: {
                stiffness: 0.2,                
            }
        });

        createdEngine.addToWorld(mouseConstraint);

        Object.assign(core, createdEngine);
        const group = createWorld();
        //core.groupGroup = group;
        worldCon = createConstructor(core);
    },
    draw: (p, props)=>{
        const { curBuildType } = core.inputs;
        const { setCurDebugText } = props.inputs;
        const isWallMode = curBuildType === 'wall';
        const isFireMode = curBuildType === 'fire';
        const now = new Date();
        const { Body, engine, removeFromWorld, rayQuery, rayQueryWithPoints, Vector, Composite } = createdEngine;
        const { getDragCellPoints, makeCell, removeBadBodies } = worldCon;
        removeBadBodies();
        const allBodies = Composite.allBodies(engine.world);
        
        if (core.curKey) {
            core.curKey = null;
            const b1 = new SimpleSqure({
                x: p.mouseX,
                y: p.mouseY,
                w: 30,
                opt: { restitution: 0.5,
                friction: 0.3 },
            }, core);
    
            const b2 = new SimpleSqure({
                x: p.mouseX+40,
                y: p.mouseY+10,
                w: 30,
                opt: { restitution: 0.5,
                friction: 0.3 },
            }, core);
    
            //length: 60
            const cst = {bodyA: b1.body, bodyB: b2.body, length: 60, stiffness:0.9};
            //engine.Constraint.create(cst);
            createdEngine.addConstraint(cst);
            core.constraints.push(cst);            
            return;
        }
        p.background(56);
        p.fill(255);
        allBodies.forEach(itemb => {
            const item = itemb.ggParent;
            if (!item) return;
            const {body, type, radius } = item;
            item.show(p);            
        });
        const addPt = (a, who)=>{
            const ba = `body${who}`;
            const pa = `point${who}`;
            const aba = a[ba];
            if (!aba) return;
            const bapos = aba.position; //a.bodyA.position
            const ppos = a[pa]; //a.point
            return {
                x: bapos.x + ppos.x,
                y: bapos.y + ppos.y,
            }
        }
        //core.constraints
        Composite.allConstraints(engine.world).forEach(cst => {
            const p1 = addPt(cst,'A');
            const p2 = addPt(cst, 'B');
            if (!p1) return;
            if (!p2) return;
            p.push();
            p.stroke(0);
            p.line(p1.x, p1.y, p2.x, p2.y);
            p.pop();
        });

        if (core.collisionEvent.name) {
            if (core.collisionEvent.name === 'collisionStart') {
                engine.timing.timeScale = 1;
            }
            if (core.collisionEvent.name === 'collisionEnd') {
                engine.timing.timeScale = 1;
            }
            const cname = core.collisionEvent.name.substr('collision'.length);
            //if (props.inputs.setCurCollisionStart)props.inputs.setCurCollisionStart(cname);
            let s = core.collisionEvent.source.pairs.list.map(c => {
                return parseFloat(c.collision.depth.toFixed(2));
            }).join(',');
            //if (cname !== 'End')
            //    props.inputs[`setCurCollision${cname}`](s);
        }        
        const pairs = core.collisions;
        //console.log(e.pairs);
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];

            if (!pair.isActive)
                continue;

            p.push();
            for (let j = 0; j < pair.activeContacts.length; j++) {
                const contact = pair.activeContacts[j],
                    vertex = contact.vertex;                                
                p.stroke(128);
                p.strokeWeight(2);
                p.rect(vertex.x - 1.5, vertex.y - 1.5, 3.5, 3.5);
            }
            p.pop();
        
            // render collision normals                    
            const collision = pair.collision;            

            if (pair.activeContacts.length > 0) {
                var normalPosX = pair.activeContacts[0].vertex.x,
                    normalPosY = pair.activeContacts[0].vertex.y;

                if (pair.activeContacts.length === 2) {
                    normalPosX = (pair.activeContacts[0].vertex.x + pair.activeContacts[1].vertex.x) / 2;
                    normalPosY = (pair.activeContacts[0].vertex.y + pair.activeContacts[1].vertex.y) / 2;
                }

                let fx, fy;
                if (collision.bodyB === collision.supports[0].body || collision.bodyA.isStatic === true) {
                    fx = normalPosX - collision.normal.x * 8;
                    fy = normalPosY - collision.normal.y * 8;
                } else {
                    fx = normalPosX + collision.normal.x * 8;
                    fy = normalPosY + collision.normal.y * 8;
                }

                p.line(fx, fy, normalPosX, normalPosY);

                if (collision.depth) {
                    const { deepCurCollisions } = core;
                    if (collision.bodyA.label === 'fireball' || collision.bodyB.label === 'fireball')
                    {
                        debugDeepCollisions.push({
                            time: new Date(),
                            depth: collision.depth,
                            x: fx,
                            y: fy,
                        });
                        
                        const fire  = collision.bodyA.label === 'fireball' ? collision.bodyA : collision.bodyB;
                        const colId = fire.id;
                        const wall = collision.bodyA.label === 'fireball' ? collision.bodyB : collision.bodyA;
                        let existing = deepCurCollisions[colId];
                        if (!existing) {
                            existing = {
                                fire,
                                wall,
                                depth: collision.depth,
                            };
                            deepCurCollisions[colId] = existing;
                        } else {
                            if (existing.depth < collision.depth) {
                                existing.depth = collision.depth;
                            }
                        }
                    }
                }
            }
        }
            
        Object.keys(core.deepCurCollisions).forEach(key => {
            const itm = core.deepCurCollisions[key];
            delete core.deepCurCollisions[key];
            itm.wall.ggParent.health -= itm.depth;
        })
        //if (core.inputs.curBuildType === 'wall') 
        {
            const mouse = core.states.mouse;
            if (mouse.state === 'pressed') {
                const bodyFound = createdEngine.getBodiesUnderPos({x:p.mouseX, y: p.mouseY});
                mouse.bodyFound = bodyFound;
                if (bodyFound && bodyFound.ggParent) {
                    const pos = bodyFound.position;
        
                    p.push();
                    p.translate(pos.x, pos.y);        
                    p.rectMode(p.CENTER);
                    p.stroke('ff0000');
                    p.strokeWeight(4);
                    p.fill('ff00ff');
                    p.rotate(bodyFound.angle);
                    p.rect(2,2, bodyFound.ggParent.w-4, bodyFound.ggParent.h-4);
                    p.pop();
                }
            }
            if (!mouse.pressLocation) return;
            if (!mouse.cur) return;

            ///====================================================>>>>>>>>                    
            const drawCellPoints = connects=> {
                connects.reduce((acc, c) => {
                    const showRect = (rr, stroke = '#ff0000', fill = '#0000ff') => {
                        p.push();
                        p.translate(rr.x, rr.y);
                        p.rotate((rr.angle || 0) + PId2);
                        p.rectMode(p.CENTER);
                        p.stroke(stroke);
                        p.strokeWeight(2);
                        p.fill(fill);
                        p.rect(0, 0, rr.w, rr.h);
                        p.pop();
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
                    p.push();
                    p.stroke('#00ff00');
                    p.strokeWeight(2);
                    const xa = pointA.x + a.x;
                    const ya = pointA.y + a.y;
                    const xb = pointB.x + b.x;
                    const yb = pointB.y + b.y;
                    //p.line(xa, ya, xb, yb);
                    showRect(Object.assign({}, a, { w: 20, h: 20 }), '#223344', '#0000ff');
                    showRect({ x: a.x + pointA.x, y: a.y + pointA.y, w: 10, h: 10 }, '#223344', '#00ff00');
                    showRect({ x: b.x + pointB.x + 10, y: b.y + pointB.y, w: 10, h: 10 }, '#223344', '#ff0000');
                    //setCurDebugText(`debugremove ===> ${dbgfmtPt(mouse.cur)} ax=${dbgfmtPt(a)} da=${dbgfmtPt(pointA)} bx is ${dbgfmtPt(b)} db=da=${dbgfmtPt(pointB)}`);
                    p.line(xa, ya, xb, yb);

                    p.pop();
                    return acc;
                }, {});
            }
                    
            
            if (mouse.state === 'dragged') {                
                if (isFireMode) {
                    p.stroke(128);
                    p.strokeWeight(2);
                    p.line(mouse.pressLocation.x, mouse.pressLocation.y, mouse.cur.x, mouse.cur.y);
                }

                if (isWallMode) {                   
                    const res = rayQueryWithPoints({x:mouse.pressLocation.x, y:mouse.pressLocation.y},{x: mouse.cur.x, y: mouse.cur.y});
                    res.forEach(r=>{                        
                        //props.inputs[`setCurCollisionStart`](`${r.x.toFixed(2)}/${r.y.toFixed(2)} `);
                        p.push();
                        p.translate(r.x, r.y);
                        p.text(r.t.toFixed(2), 0,0);        
                        p.rectMode(p.CENTER);
                        p.stroke('#ff0000');
                        p.strokeWeight(2);
                        p.fill('#0000ff');                    
                        p.rect(2,2, 4, 4);
                        p.pop();                        
                    });

                    //props.inputs[`setCurCollisionStart`](`${dists} `);                    
                    const endPoints = doWallSketch(mouse, p);
                    if (!endPoints.ok || !endPoints.end) return;

                    const wallPts = getDragCellPoints(endPoints);   
                    drawCellPoints(wallPts);
                }                
                
            }else  if (mouse.state === 'released') {                
                mouse.state = '';
                if (isFireMode) {
                    const x1 = p.mouseX;
                    const y1 = p.mouseY;
                    const x2 = core.states.mouse.pressLocation.x;
                    const y2 = core.states.mouse.pressLocation.y;
                    const w = halfWallWidth;
                    const w2 = wallWidth;
                    const ball = new SimpleCircle({
                        x: x2,
                        y: y2,
                        r: 10,
                        opts: { restitution: 0.5, collisionFilter: core.worldCats.c2.fire.getCollisionFilter() },
                    }, core);
                    ball.label = 'fireball';
                    ball.time = new Date();
                    const bbody = ball.body;
                    bbody.label = 'fireball';
                    const forceMagnitude = bbody.mass * 0.05;
                    const xx = x1-x2;
                    const yy = y1-y2;                    
                    if (Math.abs(xx)+Math.abs(yy) > 0) {
                        Body.applyForce(bbody, bbody.position, {
                            x: forceMagnitude*xx*0.01, 
                            y: forceMagnitude*yy*0.01,
                        });
                    }
                    return;
                }                
                if (mouse.bodyFound) {
                    props.inputs[`setCurCollisionEnd`](`BODY FOUND!!!!`);
                    return;
                }

                const endPoints = doWallSketch(mouse, p);

                if (!endPoints.ok) {
                    props.inputs[`setCurCollisionEnd`](`Not ok`);
                    return;
                }
                
                const wallPts = getDragCellPoints(endPoints);                     
                drawCellPoints(wallPts);
                const allWalls = makeCell(wallPts, endPoints, core.worldCats.c1.structure.getCollisionFilter());                
                allWalls.forEach(w => w.health = WALLHEALTH);
                return allWalls;
            }        
        }
        

        p.push();
        debugDeepCollisions.forEach(r => {            
            p.translate(r.x, r.y);
            p.text(r.depth.toFixed(2), 0, 0);
            p.rectMode(p.CENTER);
            p.stroke('ff0000');
            p.strokeWeight(2);
            p.fill('0000ff');
            p.rect(-2, -2, 4, 4);
        })
        p.pop();
        for (let i = debugDeepCollisions.length - 1; i>=0; i--) {
            const c = debugDeepCollisions[i];
            if (now - c.time > 1000) {
                debugDeepCollisions.splice(i, 1);
            }
        }

        if (core.debugInfo) {
            const d = core.debugInfo.body;
            //const dbgval = `dbgval pos=${dbgfmtPt(d.position)} force=${dbgfmtPt(d.force)} positionImpulse=${dbgfmtPt(d.positionImpulse)} constraintImpulse=${dbgfmtPt(d.constraintImpulse)}`;
            //if (Math.abs(d.constraintImpulse.x) > 0.5)
            //console.log(`cstImp=${dbgfmtPt(d.constraintImpulse, 2)} speed=${d.speed.toFixed(2)} angularSpeed=${d.angularSpeed.toFixed(2)}`);

            const dbgval = `dbgval bodies=${Composite.allBodies(engine.world).length} csts=${Composite.allConstraints(engine.world).length} ${d.position.y} force=${dbgfmtPt(d.force)} speed=${d.speed.toFixed(2)} angularSpeed=${d.angularSpeed.toFixed(2)}`;
            setCurDebugText(dbgval);
        }
    },
    mousePressed: p=>{
        core.states.mouse.state = 'pressed';
        core.states.mouse.pressLocation = {
            x: p.mouseX,
            y: p.mouseY,
        };
    },
    mouseDragged: p=>{
        core.states.mouse.state = 'dragged';
        core.states.mouse.cur = {
            x: p.mouseX,
            y: p.mouseY,
        };
    },
    mouseReleased:()=>{
        core.states.mouse.state = 'released';
    }
};

export function createWorld() {

    //(categoryA & maskB) !== 0 and (categoryB & maskA) !== 0
    const { addToWorld, Bodies, Body } = createdEngine;
    const { worldCats } = core;
    initCats(core, Body);
    
    new SimpleCircle({
        x: 210,
        y: 100,
        r: 30,
        opts: { restitution: 0.5, collisionFilter: worldCats.ground.structure.getCollisionFilter()},
    }, core);

    new SimpleRect({
        x: 310,
        y: 100,
        w: 30,
        h: 60,
        opts: { restitution: 0.5, collisionFilter: worldCats.ground.structure.getCollisionFilter()},
    }, core);
    
    const GroundHeight = 200;
    new SimpleRect({
        x: WIDTH/2,
        y: HEIGHT + GroundHeight/2- 10,
        w: WIDTH,
        h: GroundHeight,
        opts: { isStatic: true, label: 'Ground', collisionFilter: worldCats.ground.structure.getCollisionFilter()},
    }, core);


    //addToWorld([
    //  // walls      
    //  Bodies.rectangle(WIDTH/2, HEIGHT, WIDTH, 60, { isStatic: true })
    //])
}