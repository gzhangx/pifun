import { createEngine, getDispAng } from "../platform/engine";
import { createRender } from './ui';
import SimpleRect from '../objs/SimpleRect';
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
    const { createdEngine } = core;
    const { Body, engine, removeFromWorld, rayQuery, rayQueryWithPoints, Vector, Composite } = createdEngine;

    const {
        WIDTH,
        HEIGHT,
        wallWidth,
        halfWallWidth,
        WALLHEALTH,
        BREAKAWAYSPEED,
        BREAKAWAYANGSPEED,
    } = core.consts;
    const mouse = core.states.mouse;
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

    const getDragCellPoints = (mouseFrom, mouseCur,endPoints) => {        
        const p1 = mouseFrom;
        const p2 = mouseCur;
        const p3 = endPoints.end;
        const p4 = endPoints.start;
        if (!endPoints.end) return;
        const points = [p1, p2, p3, p4];
        if (points.filter(x => x).length != 4) return [];

        const bodies = points.reduce((acc, p, i) => {
            const connId = (i + 1) % 4;
            const bar = getRectPos(p, points[connId]);
            bar.id = i;
            bar.connId = connId;
            acc.push(bar);
            if (i === 0) {
                const pifmt = p => (p * 180 / Math.PI).toFixed(0);
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
            }
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
        return connects;
    }

    const stiffness = .95;
    const addCst = cst => {
        cst.stiffness = stiffness;
        createdEngine.addConstraint(cst);
        const addCstToBody = (bdy, cst) => {
            if (!bdy.ggConstraints) {
                bdy.ggConstraints = [];
            }
            bdy.ggConstraints.push(cst);
        }
        addCstToBody(cst.bodyA, cst);
        addCstToBody(cst.bodyB, cst);
        //core.constraints.push(cst);
    };
    const makeCell = (wallPts, downConns, collisionFilter) => {
        const makeRect = (rr, label) => new SimpleRect({
            x: rr.x, y: rr.y, w: rr.w, h: rr.h,
            opts: { label, angle: getDispAng(rr.angle), collisionFilter, },
            ggOpts: {label, health: 10, w: rr.w, h: rr.h},
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
            const bodyA = checkAdd(a).body;
            const bodyB = checkAdd(b).body;

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
        addCst({ bodyA: anchorRight, bodyB: btmBeam.body.body, pointA: getAnchorOff(downConns.end), pointB: btmRight });
        addCst({ bodyA: anchorLeft, bodyB: btmBeam.body.body, pointA: getAnchorOff(downConns.start), pointB: btmLeft });
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
                return;
            if (ggInfo.isImmortal) return;
            const killRet = { bdy, i };
            if (ggInfo && ggInfo.label === 'fireball') {
                if (now - ggInfo.time > 10000) {
                    return killRet;
                }
                return;
            }
            if (ggInfo.health <= 0 || (bdy.y > (HEIGHT * 2))) return killRet;
            if (bdy.speed > BREAKAWAYSPEED || bdy.angularSpeed > BREAKAWAYANGSPEED) {
                if (ggInfo.label === 'wall')
                    return killRet;
            }
        }).filter(x => x);

        toDelete.forEach(b => {
            removeFromWorld(b.bdy);            
        });
    }

    return {
        getDragCellPoints,
        makeCell,
        removeBadBodies,
        worldOperations: () => {
            removeBadBodies();
            processCollisions(core);
        },
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

export const processCollisions = core => {
    const { collisions, deepCurCollisions } = core;
    const pairs = core.collisions;
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];

        if (!pair.isActive)
            continue;

        // render collision normals                    
        const collision = pair.collision;

        if (pair.activeContacts.length > 0) {            
            if (collision.depth) {
                if (collision.bodyA.label === 'fireball' || collision.bodyB.label === 'fireball') {                   
                    const fire = collision.bodyA.label === 'fireball' ? collision.bodyA : collision.bodyB;
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

    Object.keys(deepCurCollisions).forEach(key => {
        const itm = deepCurCollisions[key];
        delete deepCurCollisions[key];
        if (!itm.wall.ggInfo.isImmortal)
            itm.wall.ggInfo.health -= itm.depth;
    });
};


export const initWorld = (core, { canvas, run, props }) => {
    initCats(core);   
    const {
        WIDTH,
        HEIGHT,        
    } = core.consts;    
    const createdEngine = core.createdEngine;
    const { Mouse, MouseConstraint, Events } = createdEngine.Matter;

    const mouse = Mouse.create(canvas);
    const { engine, Matter } = createdEngine;
    engine.mouse = mouse;
    const mouseConstraint = MouseConstraint.create(engine, {
        element: canvas,
        constraint: {
            stiffness: 0.2,
        }
    });

    resetMouseConstraint(Matter)

    const outOfBound = e => {
        const p = e.mouse.absolute;
        if (p.x < 0) return true;
        if (p.x > WIDTH) return true;
        if (p.y < 0) return true;
        if (p.y > HEIGHT) return true;
        return false;
    }
    Events.on(mouseConstraint, 'mousemove', e => {
        if (outOfBound(e)) return;
        const p = getMouse(e.mouse.position);
        core.states.mouse.state = 'dragged';
        core.states.mouse.cur = p;
    });
    Events.on(mouseConstraint, 'mousedown', e => {
        if (outOfBound(e)) return;
        const p = getMouse(e.mouse.position);
        core.states.mouse.state = 'pressed';
        core.states.mouse.pressLocation = p;
        mouseConstraint.body = createdEngine.getBodiesUnderPos(p);
    });
    Events.on(mouseConstraint, 'mouseup', e => {
        core.states.mouse.state = 'released';
        if (outOfBound(e)) return;
        const p = getMouse(e.mouse.position);
        core.states.mouse.cur = p;
    });
    core.createdEngine.addToWorld(mouseConstraint);
    core.render = createRender({
        core,
        canvas,
        run: () => run(props),
        options: {
            width: WIDTH,
            height: HEIGHT,
        }
    })
    //core.groupGroup = group;
    core.worldCon = createConstructor(core);
    core.render.run();
}


function resetMouseConstraint({ MouseConstraint, Bounds, Detector, Vertices, Events, Sleeping}) {
    MouseConstraint.update = function (mouseConstraint, bodies) {
        const mouse = mouseConstraint.mouse,
            constraint = mouseConstraint.constraint,
            body = mouseConstraint.body;

        if (mouse.button === 0) {
            if (!constraint.bodyB) {
                if (body) {                
                    if (Bounds.contains(body.bounds, mouse.position)
                        && Detector.canCollide(body.collisionFilter, mouseConstraint.collisionFilter)) {
                        for (var j = body.parts.length > 1 ? 1 : 0; j < body.parts.length; j++) {
                            var part = body.parts[j];
                            if (Vertices.contains(part.vertices, mouse.position)) {
                                constraint.pointA = mouse.position;
                                constraint.bodyB = mouseConstraint.body = body;
                                constraint.pointB = { x: mouse.position.x - body.position.x, y: mouse.position.y - body.position.y };
                                constraint.angleB = body.angle;

                                Sleeping.set(body, false);
                                Events.trigger(mouseConstraint, 'startdrag', { mouse: mouse, body: body });

                                break;
                            }
                        }
                    }
                }
            } else {
                Sleeping.set(constraint.bodyB, false);
                constraint.pointA = mouse.position;
            }
        } else {
            constraint.bodyB = mouseConstraint.body = null;
            constraint.pointB = null;

            if (body)
                Events.trigger(mouseConstraint, 'enddrag', { mouse: mouse, body: body });
        }
    };
}