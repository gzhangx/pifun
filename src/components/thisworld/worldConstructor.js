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

export const createConstructor = (core) => {
    const { createdEngine } = core;
    const { Body, engine, removeFromWorld, rayQuery, rayQueryWithPoints, Vector, Composite } = createdEngine;

    const {
        wallWidth,
        halfWallWidth,
        PId2,
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

    const getDragCellPoints = endPoints => {
        const p1 = mouse.pressLocation
        const p2 = mouse.cur;
        const p3 = endPoints.end;
        const p4 = endPoints.start;
        if (!endPoints.end) return;
        const points = [p1, p2, p3, p4];

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
        const makeRect = (rr, label) => new SimpleRect({ x: rr.x, y: rr.y, w: rr.w, h: rr.h, opts: { label, angle: rr.angle + PId2, collisionFilter, } }, core); //tl
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


    return {
        getDragCellPoints,
        makeCell,
    }
}