import { createEngine, getDispAng } from "../platform/engine";
import { createRender } from './ui';
import CreateSimpleRect from '../objs/SimpleRect';
import { Vector, Body, Bounds, Mouse } from "matter-js";
import CreateSimpleCircle from '../objs/SimpleCircle';
import {sendWsMsg} from './socket';
import { setupMultiplayer } from './multiplayer';
import { get } from 'lodash';
import { sendWsPlayerInputs } from './inputTransfer';

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

export const getMouse = p => ({
    x: p.x,
    y: p.y,
});

export const createConstructor = (core) => {
    const { createdEngine, removeFromWorld } = core;
    const { engine, Vector, Composite } = createdEngine;

    const {
        HEIGHT,
        wallWidth,
        BREAKAWAYSPEED,
        BREAKAWAYANGSPEED,
    } = core.consts;
    const getRectPos = (startPoint, endPoint) => {
        const angle = Vector.angle(startPoint, endPoint), // - PId2
            h = Vector.magnitude(Vector.sub(startPoint, endPoint)),
            x = (endPoint.x + startPoint.x) * 0.5,
            y = (endPoint.y + startPoint.y) * 0.5;
        return {
            x, y, w: wallWidth, h,
            angle,
        }
    }

    const getDragCellPoints = (mouseFrom, mouseCur, endPoints) => {
        const p1 = mouseFrom;
        const p2 = mouseCur;
        const p3 = endPoints.end;
        const p4 = endPoints.start;
        if (!endPoints.end) return;
        const points = [p1, p2, p3, p4];
        if (points.filter(x => x).length !== 4) return [];

        const bodies = points.reduce((acc, p, i) => {
            const connId = (i + 1) % 4;
            const bar = getRectPos(p, points[connId]);
            bar.id = i;
            bar.connId = connId;
            acc.push(bar);
            return acc;
        }, []);



        const ops = [['+', '-'], ['+', '-'], ['+', '-'], ['+', '-']];
        const connects = ops.map((pops, i) => {
            const a = bodies[i];
            const b = bodies[a.connId];
            //const pops = ops[i];


            return {
                a, b,
                pointA: getConstraintOffset(pops[0], a),
                pointB: getConstraintOffset(pops[1], b),
            };
        });

        connects.push({
            a: bodies[0],
            b: bodies[2],
            pointA: getConstraintOffset('-', bodies[0]),
            pointB: getConstraintOffset('-', bodies[2]),
        });
        return {
            points,
            connects,
        }
    }

    const stiffness = .95;
    const addCst = cst => {
        if (!cst.stiffness) cst.stiffness = stiffness;
        //cst.stiffness = stiffness;
        createdEngine.addConstraint(cst);
        const addCstToBody = (bdy, cst) => {
            if (!bdy) return;
            if (!bdy.ggConstraints) {
                bdy.ggConstraints = [];
            }
            bdy.ggConstraints.push(cst);
        }
        addCstToBody(cst.bodyA, cst);
        addCstToBody(cst.bodyB, cst);
        //core.constraints.push(cst);
    };
    /**
     * 
     * @param {object} wallPts Array of {a,b, pointA, pointB}
     * @param {*} downConns end,start {x, body.position}
     * @param {*} collisionFilter 
     * @param {*} playerInfo {side, player}
     */
    const makeCell = (wallPts, downConns, collisionFilter, playerInfo) => {
        const makeRect = (rr, label) => CreateSimpleRect({
            x: rr.x, y: rr.y, w: rr.w, h: rr.h,
            opts: { label, angle: getDispAng(rr.angle), collisionFilter, },
            ggOpts: { label, health: 10, w: rr.w, h: rr.h, playerInfo },
        }, core.createdEngine); //tl
        const allWalls = wallPts.reduce((acc, pt) => {
            const { a, b, pointA, pointB } = pt;
            const checkAdd = x => {
                if (!acc[x.id]) {
                    x.body = makeRect(x, x.id);
                    x.body.label = 'wall';
                    acc[x.id] = x.body;
                    acc.all.push(x.body);
                }
                return x.body;
            }
            const bodyA = checkAdd(a);
            const bodyB = checkAdd(b);

            const cst = { bodyA, bodyB, pointA, pointB, stiffness };
            addCst(cst);
            return acc;
        }, {
            all: [],
        }).all;

        const btmBeam = wallPts[2].a;
        const btmRight = getConstraintOffset('-', btmBeam);
        const btmLeft = getConstraintOffset('+', btmBeam);
        const anchorRight = downConns.end.body;
        const anchorLeft = downConns.start.body;
        const getAnchorOff = a => {
            return {
                x: a.x - a.body.position.x,
                y: a.y - a.body.position.y,
            }
        };
        addCst({ bodyA: anchorRight, bodyB: btmBeam.body, pointA: getAnchorOff(downConns.end), pointB: btmRight });
        addCst({ bodyA: anchorLeft, bodyB: btmBeam.body, pointA: getAnchorOff(downConns.start), pointB: btmLeft });
        if (!core.debugInfo) {
            core.debugInfo = allWalls[0];
        }
        return allWalls;
    };

    const removeBadBodies = () => {
        const now = new Date();
        const allBodies = Composite.allBodies(engine.world);
        const toDelete = allBodies.map((bdy, i) => {
            const ggInfo = bdy.ggInfo;
            if (!ggInfo)
                return null;
            if (ggInfo.isImmortal) return null;
            const killRet = { bdy, i };
            if (ggInfo && ggInfo.label === 'fireball') {
                if (now - ggInfo.time > 10000) {
                    return killRet;
                }
                return null;
            }
            if (ggInfo.health <= 0 || (bdy.position.y > (HEIGHT * 2))) return killRet;
            if (bdy.speed > BREAKAWAYSPEED || bdy.angularSpeed > BREAKAWAYANGSPEED) {
                if (ggInfo.label === 'wall')
                    return killRet;
            }
            return null;
        }).filter(x => x);

        toDelete.forEach(b => {
            removeFromWorld(b.bdy);
        });
    }

    return {
        getDragCellPoints,
        addCst,
        makeCell,
        removeBadBodies,
        doSelect: playerId => doSelect({ core, removeFromWorld, playerId}),
        doDragDrop: () => doDragDrop(core),
        doDragDrop,
        showSelect: ({ isSelect,
            //key,
            playerState,
            side, }) => showSelect({
                core,
                playerState,
                //isSelect,
                //mouse,
                //key,
                side,
            }),
        doTranslate: translate => doTranslate(core, translate),
        doFireBall: (p1, p2, side) => doFireBall(core, p1, p2, side),
        worldOperations: () => {
            removeBadBodies();
            processCollisions(core);

            core.processMyMouseEvents();
            core.playersInfo.playerIds.map(pid => {
                const player = core.getPlayerInputStateById(pid);
                core.processMouseConstraint(player);
            });        
            sendWsPlayerInputs(core);

            core.playersInfo.playerIds.map(pid => {
                const player = core.getPlayerInputStateById(pid);
                player.loopKey = player.curKey;
                player.curKey = null;
                //props.inputs.setUISelectedObj(core.selectObj);
            });
        },
        checkWallPoints,
    }
}


const initCats = (core) => {
    const createdEngine = createEngine();
    core.createdEngine = createdEngine;
    const { Body } = createdEngine;
    const { worldCats } = core;
    const createCats = c => {
        if (c.structure) {
            c.structure.category = Body.nextCategory();
        }
        if (c.fire) {
            c.fire.category = Body.nextCategory();
        }
    }
    createCats(worldCats.ground);
    createCats(worldCats.c1);
    createCats(worldCats.c2);

    const getStructMask = c => c.structure.category | c.fire.category | 1;
    const getStructMaskGnd = c => getStructMask(c) | worldCats.ground.structure.category;


    worldCats.c1.structure.mask = getStructMask(worldCats.c2);
    worldCats.c1.fire.mask = getStructMaskGnd(worldCats.c2);
    worldCats.c2.structure.mask = getStructMask(worldCats.c1);
    worldCats.c2.fire.mask = getStructMaskGnd(worldCats.c1);
    worldCats.ground.structure.mask = worldCats.c1.fire.category | worldCats.c2.fire.category | worldCats.ground.structure.category | 1;

    const createCollisionFilter = c => ({
        mask: c.mask,
        category: c.category
    });
    worldCats.ground.structure.getCollisionFilter = () => createCollisionFilter(worldCats.ground.structure);
    worldCats.c1.structure.getCollisionFilter = () => createCollisionFilter(worldCats.c1.structure);
    worldCats.c1.fire.getCollisionFilter = () => createCollisionFilter(worldCats.c1.fire);
    worldCats.c2.structure.getCollisionFilter = () => createCollisionFilter(worldCats.c2.structure);
    worldCats.c2.fire.getCollisionFilter = () => createCollisionFilter(worldCats.c2.fire);


    createdEngine.eventCallbacks.collisionEvent = (e) => {
        core.collisionEvent = e;
        if (e.name === 'collisionStart') {
            core.collisions = e.pairs;
        }
    };

    return core;
}

function isFireball(body) {
    const ggInfo = body.ggInfo;
    if (!ggInfo) return false;
    return (ggInfo.label === 'fireball');
}
export const processCollisions = core => {
    const { deepCurCollisions } = core;
    const pairs = core.collisions;
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];

        if (!pair.isActive)
            continue;

        // render collision normals                    
        const collision = pair.collision;

        if (pair.activeContacts.length > 0) {
            if (collision.depth) {
                const isFireA = isFireball(collision.bodyA) ? collision.bodyA : null;
                const fire = isFireA || (isFireball(collision.bodyB) ? collision.bodyB : null);
                if (fire) {
                    //const fire = collision.bodyA.label === 'fireball' ? collision.bodyA : collision.bodyB;
                    const colId = fire.id;
                    const wall = isFireA ? collision.bodyB : collision.bodyA;
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

    Object.keys(deepCurCollisions).forEach(key => {
        const itm = deepCurCollisions[key];
        delete deepCurCollisions[key];
        if (!itm.wall.ggInfo.isImmortal)
            itm.wall.ggInfo.health -= itm.depth;
    });
};


export const initWorld = (core, { canvas, run, props, renderOpts }) => {
    initCats(core);
    const {
        WIDTH,
        HEIGHT,
    } = core.consts;
    const createdEngine = core.createdEngine;
    const { Mouse, Events, Constraint,
        Detector, Vertices, Sleeping,
    } = createdEngine.Matter;

    const { engine, Matter } = createdEngine;
    //engine.mouse = mouse;
    const amouse = Mouse.create(canvas);

    //resetMouseConstraint(Matter)

    const curPlayerState = core.getCurPlayerInputState();
    function syncMyMouse(act) {
        const mouse = curPlayerState.mouse;
        mouse.state = act(mouse.state);
        const pm = mouse.cur;
        const ap = amouse.position;
        pm.x = ap.x;
        pm.y = ap.y;
        pm.button = amouse.button;
        return mouse;
    }
    const outOfBound = () => {
        const p = amouse.absolute;
        if (p.x < 0) return true;
        if (p.x > WIDTH) return true;
        if (p.y < 0) return true;
        if (p.y > HEIGHT) return true;
        return false;
    }
    const mousemove = () => {
        syncMyMouse(state => {
            if (state === 'dragged' || state === 'pressed') {
                return 'dragged';
            }
            return 'moved';
        });        
    };
    const processMyMouseEvents = () => {
        const mouseEvents = amouse.sourceEvents;
        if (mouseEvents.mouseup)
            mouseup();        
        else if (!outOfBound()) {
            if (mouseEvents.mousedown)
                mousedown();
            else if (mouseEvents.mousemove)
                mousemove();            
        }

        // reset the mouse state ready for the next step
        Mouse.clearSourceEvents(amouse);
    }
    
    const mousedown= () => {                
        const p = getMouse(amouse.position);
        const mouse = syncMyMouse(() => 'pressed');        
        mouse.pressLocation = p;

        curPlayerState.selectObj.curProcessed = false;        
        //mouseConstraint.body = createdEngine.getBodiesUnderPos(p);
    };
    const mouseup = () => {
        //const mouse = core.getCurPlayerInputState().mouse;
        //mouse.state = 'released';
        syncMyMouse(() => 'released');
    };

    setupMultiplayer(core);
    
    core.render = createRender({
        core,
        canvas,
        run: () => run(core, props),
        options: renderOpts || {
            showAxes: true,
            hasBounds: true,
            width: WIDTH,
            height: HEIGHT,
            postRender: (ctx, opt) => { },
        }
    })
    core.getCurPlayerInputState().events.onSelectedObjectChanged = props.inputs.setUISelectedObj;

    core.removeFromWorld = itm => createdEngine.removeFromWorld(itm, core);
    //core.groupGroup = group;
    core.processMouseConstraint = playerState => processMouseConstraint({
        playerState, Constraint,
        createdEngine,
        Bounds, Detector, Vertices, Sleeping
    });
    core.processMyMouseEvents = processMyMouseEvents;
    core.worldCon = createConstructor(core);
    //core.inputs.actualMouse = mouse;
    core.sendWsMsg = sendWsMsg;
    const buildTypes = {
        circle: CreateSimpleCircle,
        rectangle: CreateSimpleRect,
    }
    core.importBuildInfo = ({bodies, constraints}) => {
        const importedConstraints = {};
        const keys = bodies.reduce((acc, build) => {
            const binf = build.buildInfo;
            if (!binf.opts) binf.opts = {};
            binf.opts.id = binf.id;
            const b = buildTypes[binf.type](binf, core.createdEngine);
            b.isStatic = true;
            if (build.position.x !== b.position.x || build.position.y !== b.position.y) {
                Body.setPosition(b, build.position);
            }
            if (binf.angle) {
                Body.setAngle(b, binf.angle);
            }
            acc[b.id] = b;
            return acc;
        }, {});
        const rbody = bb => bb && keys[bb.id];
        constraints.forEach(cst => {
            core.worldCon.addCst({
                pointA: cst.pointA,
                pointB: cst.pointB,
                bodyA: rbody(cst.bodyA),
                bodyB: rbody(cst.bodyB),
                opts: cst.opts,
            });
        });
    }
    core.syncBuildInfo = ({ bodies }) => {
        const ebk = core.createdEngine.engine.world.bodies.reduce((acc, b) => {
            acc[b.id] = b;
            return acc;
        }, {});
        const keys = bodies.reduce((acc, build) => {
            const binf = build.buildInfo;
            if (!binf.opts) binf.opts = {};
            binf.opts.id = binf.id;
            const ex = ebk[binf.id];
            const b = ex || buildTypes[binf.type](binf, core.createdEngine);
            b.isStatic = true;
            if (binf.angle) {
                Body.setAngle(b, binf.angle);
            }
            if (ex) {
                Body.setPosition(b, binf)
            }
            acc[b.id] = b;
            return acc;
        }, {});
    }
    
    core.render.run();
}


function processMouseConstraint({ playerState, Constraint, Bounds, createdEngine, Vertices, Sleeping }) {
    
    const { mouse, mouseConstraint } = playerState;
    const disabled = mouseConstraint.disabled;
    if (mouse.state === 'pressed') {
        mouseConstraint.body = createdEngine.getBodiesUnderPos(mouse.cur);
    }
        
    let constraint = mouseConstraint.constraint;
    if (!constraint) {
        constraint = Constraint.create({
            label: 'Mouse Constraint',
            pointA: mouse.cur,
            pointB: { x: 0, y: 0 },
            length: 0.01,
            stiffness: 0.1,
            angularStiffness: 1,
            render: {
                strokeStyle: '#90EE90',
                lineWidth: 3
            }
        });
        playerState.mouseConstraint.constraint = constraint;
        createdEngine.addToWorld(constraint);
    }

    if (disabled) {
        constraint.bodyB = null;
        constraint.pointB = null;
        return;
    }
    
    if (mouse.cur.button === 0) {
        if (!constraint.bodyB) {
            const { body } = mouseConstraint;
                if (body) {
                    if (Bounds.contains(body.bounds, mouse.cur)
                    //    && Detector.canCollide(body.collisionFilter, mouseConstraint.collisionFilter)
                    ) {
                        for (var j = body.parts.length > 1 ? 1 : 0; j < body.parts.length; j++) {
                            var part = body.parts[j];
                            if (Vertices.contains(part.vertices, mouse.cur)) {
                                constraint.pointA = mouse.cur;
                                constraint.bodyB = mouseConstraint.body = body;
                                constraint.pointB = { x: mouse.cur.x - body.position.x, y: mouse.cur.y - body.position.y };
                                constraint.angleB = body.angle;

                                Sleeping.set(body, false);
                                break;
                            }
                        }
                    }
                }
            } else {
                Sleeping.set(constraint.bodyB, false);
                constraint.pointA = mouse.cur;
            }
        } else {
            constraint.bodyB = mouseConstraint.body = null;
            constraint.pointB = null;

            //if (body)
            //    Events.trigger(mouseConstraint, 'enddrag', { mouse: mouse, body: body });
        }
}


function doSelect({
    core,
    removeFromWorld,
    playerId,
}) {
    const playerState = core.getPlayerInputStateById(playerId);
    const {mouseConstraint} = playerState;
    const key = playerState.loopKey;
    const { selectObj, mouse, curBuildType } = playerState;
    if (curBuildType !== 'select') return;
    if (!selectObj.cur || !selectObj.curProcessed) {
        if (mouseConstraint.body) {
            selectObj.curProcessed = true;
            selectObj.curBase = mouseConstraint.body;
            selectObj.cur = mouseConstraint.body;
            selectObj.prevPos = { ...selectObj.curBase.position };
            selectObj.curInd = -1;
            selectObj.curType = 'selbody';
            selectObj.dragStartPoint = null;
            core.raiseMySelectedObjChange();
        }
    } else {
        const body = selectObj.curBase;
        if (key === 'a' || key === 'n') {
            const curInd = selectObj.curInd + 1;
            if (!body.ggConstraints || curInd >= body.ggConstraints.length) {
                //selectObj.curBase = mouseConstraint.body;
                selectObj.cur = selectObj.curBase;
                selectObj.curInd = -1;
                selectObj.curType = 'selbody';                
            } else {
                selectObj.curInd = curInd;
                selectObj.cur = body.ggConstraints[curInd];
                selectObj.curType = 'constraint';                
            }
            core.raiseMySelectedObjChange();
        }
    }

    const sel = selectObj.cur;
    if (sel && (sel.bodyA || sel.bodyB)) {
        if (key === '1') {
            sel.length++;
        } else if (key === '2') {
            if (sel.length > 0) sel.length--;
        }
    }

    const body = selectObj.cur;
    if (body && key === 'Delete') {
        const canDel1 = body.ggInfo && body.ggInfo.player !== 0 && !body.ggInfo.isImmortal;
        const isCons = body.bodyA || body.bodyB;
        if (canDel1 || isCons) {
            removeFromWorld(body);
        }
        if (mouseConstraint.body === body) {
            mouseConstraint.body = null;
        }
        selectObj.cur = null;
        selectObj.curInd = -1;
        core.inputs.curKey = '';
    }

    if (body && selectObj.curProcessed && core.inputs.isDesignMode && mouse.state === 'pressed') {
        //selected and pressed again
        if (!selectObj.dragStartPoint) {
            selectObj.dragStartPoint = mouse.cur;
            selectObj.dragOffset = Vector.sub(mouse.cur, selectObj.cur.ggInfo.buildInfo);
            console.log('drag offset')
            console.log(selectObj.dragOffset);
        }
    }
    if (mouse.state === 'released') {
        selectObj.dragStartPoint = null;
    }
}

function doDragDrop(core) {
    const { removeFromWorld } = core;
    const { selectObj, mouse } = core.getCurPlayerInputState();
    const { cur, dragStartPoint } = selectObj;    
    if (!dragStartPoint || !cur) return;
    if (!core.inputs.isDesignMode) return;
    const ggInfo = cur.ggInfo;
    if (!ggInfo.funcs.addDesignCst) return;// not designer item
    console.log('translate '+ dragStartPoint + ' cur='+cur)
    console.log(Vector.sub(mouse.cur, selectObj.dragOffset));
    if (cur.ggConstraints && cur.ggConstraints.length) {
        const toBeRemoved = cur.ggConstraints.filter(c => c.ggCstInfo && c.ggCstInfo.type ==='designerCst')
        toBeRemoved.forEach(removeFromWorld);
        cur.ggConstraints = cur.ggConstraints.filter(c => !c.ggCstInfo || c.ggCstInfo.type !== 'designerCst')
    }
    const newPos = Vector.sub(mouse.cur, selectObj.dragOffset);    
    const binf = ggInfo.buildInfo;
    binf.x = newPos.x;
    cur.ggInfo.buildInfo.y = newPos.y;
    Body.setPosition(cur, newPos);
    if (ggInfo.funcs && ggInfo.funcs.addDesignCst) {
        ggInfo.funcs.addDesignCst(newPos);
    }
}

function showSelect({
    core,
    //isSelect,
    //mouse,
    //key,
    side,
    playerState,
}) {    
    const { selectObj, mouse, loopKey, curBuildType } = playerState;
    if (!selectObj) return;
    const isSelect = curBuildType === 'select';
    const key = loopKey;
    const body = selectObj.cur;
    if (!body) return;
    
    const ggInfo = selectObj.cur.ggInfo;    
    if (ggInfo) {
        const prevPos = ggInfo.buildInfo;
        if (prevPos) {
            const xDiff = Math.abs(prevPos.x - body.position.x);
            if (xDiff >= 1
                || Math.abs(prevPos.y - body.position.y) >= 1) {
                core.raiseMySelectedObjChange();
                selectObj.prevPos = { ...body.position };
            }
        }
    }

    if (!isSelect) return;
    //const mouse = core.states.mouse;
    const selectInfo = {};
    
    if (selectObj.curType === 'selbody') {
        selectInfo.bodyPos = body.position;
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

        selectInfo.constraint = {
            start,
            end,
        };
    }

    if (mouse.cur) {
        const ggInfo = body.ggInfo;
        if (ggInfo && ggInfo.label === 'Cannon') {
            const part = body.parts[0];
            const p1 = part.vertices[ggInfo.dir[0]];
            const p2 = part.vertices[ggInfo.dir[1]];
            const v = Vector.sub(p2, p1);
            const deg = Math.atan2(v.y, v.x);
            const limitGrad = 15 / 180 * Math.PI;

            const bpx = body.position.x;
            const bpy = body.position.y;
            const len = 100;
            const dovn = (deg, len) => {
                const x = Math.cos(deg) * len;
                const y = Math.sin(deg) * len;
                const to = {
                    x: x + bpx,
                    y: y + bpy,
                }
                return to;
            }
            const degl1 = deg + limitGrad;
            const degl2 = deg - limitGrad;
            //const to2 = dovn(degl1, len);
            const to1 = dovn(degl2, len);
            const diry = mouse.cur.y - bpy;
            const dirx = mouse.cur.x - bpx;
            const mdeg = Math.atan2(diry, dirx);
            //setCurDebugText(`dirxy=${dirx.toFixed(0)} ${diry.toFixed(0)}`);
            if (mdeg >= degl2 && mdeg <= degl1) {
                //dovn(mdeg, len);
                if (key === 'z') {
                    doFireBall(core, {
                        x: bpx,
                        y: bpy,
                    },
                        mouse.cur,
                        side,
                    );
                }
                const to = {
                    x: dirx + bpx,
                    y: diry + bpy,
                }
                selectInfo.cannonDir = {
                    bpx,
                    bpy,
                    to,
                }
            }

            selectInfo.cannonCone = {
                bpx,
                bpy,
                to1,
                len,
                degl2, degl1,
            }

        }
    }
    return selectInfo;
}


function doTranslate(core, translate) {
    //render: core.render, mouse: engine.mouse, translate: screenOff,
    //world: engine.world,
    // prevent the view moving outside the world bounds
    const { render, createdEngine } = core;
    const { engine } = createdEngine;
    const { mouse, world } = engine;
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

function doFireBall(core, p2, p1, side) {
    const x1 = p1.x;
    const y1 = p1.y;
    const x2 = p2.x;
    const y2 = p2.y;
    const bbody = CreateSimpleCircle({
        x: x2,
        y: y2,
        r: 10,
        label: 'fireball',
        opts: { restitution: 0.5, collisionFilter: core.worldCats.getCat(side).fire.getCollisionFilter() },
        ggOpts: { label: 'fireball', time: new Date(), side },
    }, core.createdEngine);
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
}

function checkWallPoints(wallPts) {
    if (!wallPts) return null;
    const { points } = wallPts;
    if (!points) return null;
    console.log(points);
    const res = points.reduce(({ last, total }, pt) => {
        const l = Vector.magnitude(Vector.sub(last, pt));
        console.log(`calc ${last.x},${last.y} ${pt.x},${pt.y}`)
        return {
            last: pt,
            total: total + l,
        }
    }, { last: points[3], total: 0 });
    return res.total;
}