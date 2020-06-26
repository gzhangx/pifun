import SimpleCircle from '../objs/SimpleCircle';
import SimpleSqure from '../objs/SimpleSqure';
import SimpleRect from '../objs/SimpleRect';

export const allBodies = [];
export const WIDTH = 600;
export const HEIGHT = 600;

const core = {
    allBodies,
    constraints: [],
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
    }
}
let createdEngine ;

const wallWidth = 20;
const halfWallWidth = wallWidth / 10;
const PId2 = -Math.PI / 2
const dbgfmtPt = p => `(${p.x.toFixed(0)}/${p.y.toFixed(0)})`;
const fmt2Int = p => parseInt(p);

function doWallSketch(mouse, p) {
    const {rayQueryWithPoints} = createdEngine;
    const start = rayQueryWithPoints({x:mouse.pressLocation.x, y:mouse.pressLocation.y},{x: mouse.pressLocation.x, y: HEIGHT});
    start.forEach(r=>{                        
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

    return {
        ok: Math.abs(mouse.cur.x - mouse.pressLocation.x) > wallWidth*2,
        start: start[0],
        end: endpt[0],
    }
}
export default  {
    WIDTH,
    HEIGHT,
    core,
    setup: (p, engineCreated, canvas)=>{
        const convas = p.createCanvas(WIDTH, HEIGHT);
        convas.parent('p5-parent');
        createdEngine = engineCreated;
        const {Mouse, MouseConstraint} = createdEngine.Matter;
        createdEngine.eventCallbacks.collisionEvent = (e)=>{            
            core.collisionEvent = e;
            if (e.name === 'collisionActive' || e.pairs.length) {
                core.collisions = e.pairs;                
            }
            if (e.name === 'collisionStart') {
                console.log('collisionStart ' + e.pairs.length);
                console.log(e.source.pairs.list);
            }
            if (e.name === 'collisionEnd') {
                console.log('collisionEnd' + e.source.pairs.list.length);
                console.log(e);
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
        //core.addToWorld = eng.addToWorld;        
        //core.Bodies = eng.Bodies;
        createWorld();
    },
    draw: (p, props)=>{
        const { curBuildType } = core.inputs;
        const { setCurDebugText } = props.inputs;
        const isWallMode = curBuildType === 'wall';
        const isFireMode = curBuildType === 'fire';
        const now = new Date();
        const toDelete = core.allBodies.map((b,i)=>{
            if(b.label === 'fireball') {
                if (now - b.time > 10000) {                    
                    return {b,i};
                }
            }
        }).filter(x=>x).reverse();
        const {Body, engine, removeFromWorld, rayQuery, rayQueryWithPoints, Vector} = createdEngine;
        toDelete.forEach(d=>{
            removeFromWorld(d.b.body);
            core.allBodies.splice(d.i,1);
        });                
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
        allBodies.forEach(item=>{
            const {body, type, radius } = item;
            item.show(p);            
        });
        const addPt = (a, who)=>{
            const ba = `body${who}`;
            const pa = `point${who}`;
            const bapos = a[ba].position; //a.bodyA.position
            const ppos = a[pa]; //a.point
            return {
                x: bapos.x + ppos.x,
                y: bapos.y + ppos.y,
            }
        }
        core.constraints.forEach(cst=>{
            const p1 = addPt(cst,'A');
            const p2 = addPt(cst,'B');
            p.stroke(0);
            p.line(p1.x, p1.y, p2.x, p2.y);
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
            if (cname !== 'End')
                props.inputs[`setCurCollision${cname}`](s);
        }        
        p.push();
        const pairs = core.collisions;
        //console.log(e.pairs);
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];

            if (!pair.isActive)
                continue;

            for (let j = 0; j < pair.activeContacts.length; j++) {
                const contact = pair.activeContacts[j],
                    vertex = contact.vertex;                                
                p.stroke(128);
                p.strokeWeight(2);
                p.rect(vertex.x - 1.5, vertex.y - 1.5, 3.5, 3.5);
            }
        
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
            }
        }
            
        //if (core.inputs.curBuildType === 'wall') 
        {
            const mouse = core.states.mouse;
            if (!mouse.pressLocation) return;
            if (!mouse.cur) return;

            ///====================================================>>>>>>>>
            const getRectPos = (startPoint, endPoint) => {
                const angle = Vector.angle(startPoint, endPoint) - PId2,
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
                    showRect(bar);
                    acc.push(bar);
                    return acc;
                },[]);

                const showRect = rr => {
                    p.push();
                    p.translate(rr.x, rr.y);
                    p.rotate(rr.angle);
                    p.rectMode(p.CENTER);
                    p.stroke('ff0000');
                    p.strokeWeight(2);
                    p.fill('0000ff');
                    p.rect(0, 0, rr.w, rr.h);
                    p.pop();
                };

                const ops = [['+r','-t'],['+t','r'],['-r','+t'],['+t','-r']];
                const connects = ord.map((b, i) => {                                    
                    const a = bodies[i];
                    const b = bodies[a.connId];
                    const pops = ops[i];
                    const createOps = (op, obj) => {
                        let x, y;
                        const { angle, h } = obj;
                        const hh = h / 2;
                        if (op[1] === 'r') {
                            x = Math.sin(angle);
                            y = Math.cos(angle);
                        } else {
                            x = Math.cos(angle);
                            y = Math.sin(angle);
                        }
                        if (op[0] === '-1') {
                            x *= -1;
                            y *= -1;
                        }
                        x *= hh;
                        y *= hh; 
                        return { x, y };
                    };
                    return {
                        a, b,
                        pa: createOps(pops[0], a),
                        pb: createOps(pops[1], b),
                    };
                });
                                
                return connects;
            };
            const makeCell = endPoints => {
                const p1 = mouse.pressLocation
                const p2 = mouse.cur;
                const p3 = endPoints.end;
                const p4 = endPoints.start;
                if (!endPoints.end) return;
                const tbp = getRectPos(p1, p2);
                var group = Body.nextGroup(true);
                const makeRect = (rr, label) => new SimpleRect({ x: rr.x, y: rr.y, w: rr.w, h: rr.h, opts: { label, angle: rr.angle, collisionFilter: { group } } }, core); //tl
                const tb = makeRect(tbp, 'tb');
                const rbp = getRectPos(p2, p3)
                const rb = makeRect(rbp, 'rb');
                const bbp = getRectPos(p3, p4);
                const bb = makeRect(bbp, 'bb');
                const lbp = getRectPos(p4, p1);
                const lb = makeRect(lbp, 'lb');
                //props.inputs[`setCurCollisionEnd`](`p1=${dbgfmtPt(p1)} ${dbgfmtPt(p2)} ${dbgfmtPt(p3)} ${dbgfmtPt(p4)}`);
                const addCst = cst => {
                    createdEngine.addConstraint(cst);
                    core.constraints.push(cst);
                };
                const stiffness = .05;                
                addCst({ bodyA: tb.body, bodyB: rb.body, pointA: { x: tbp.h / 2 , y: 0 }, pointB: { x: 0, y: -rbp.h/2 }, stiffness });
                addCst({ bodyA: rb.body, bodyB: bb.body, pointA: { x: 0, y: rbp.h / 2 }, pointB: { x: bbp.h / 2, y: 0 }, stiffness });
                addCst({ bodyA: bb.body, bodyB: lb.body, pointA: { x: -bbp.h / 2, y: 0 }, pointB: { x: 0, y: lbp.h / 2 }, stiffness });
                addCst({ bodyA: lb.body, bodyB: tb.body, pointA: { x: 0, y: -lbp.h / 2 }, pointB: { x: -tbp.h/2, y: 0 }, stiffness });
            };

            if (mouse.state === 'pressed') {
                const bodyFound = createdEngine.getBodiesUnderPos({x:p.mouseX, y: p.mouseY})[0];
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
                        p.stroke('ff0000');
                        p.strokeWeight(2);
                        p.fill('0000ff');                    
                        p.rect(2,2, 4, 4);
                        p.pop();                        
                    });

                    //props.inputs[`setCurCollisionStart`](`${dists} `);                    
                    
                }
                const endPoints = doWallSketch(mouse, p);
                if (!endPoints.ok || !endPoints.end) return;
                const p1 = mouse.pressLocation
                const p2 = mouse.cur;
                const p3 = endPoints.end;
                const p4 = endPoints.start;                

                const drawRr = rr => {
                    p.push();
                    p.translate(rr.x, rr.y);                    
                    p.rotate(rr.angle);
                    p.rectMode(p.CENTER);
                    p.stroke('ff0000');
                    p.strokeWeight(2);
                    p.fill('0000ff');
                    p.rect(0, 0, rr.w, rr.h);
                    p.pop();
                }

                const p1p2 = getRectPos(p1, p2);
                drawRr(p1p2);
                setCurDebugText(`${dbgfmtPt(mouse.pressLocation)} ${dbgfmtPt(mouse.cur)} ${fmt2Int(p1p2.x)},${fmt2Int(p1p2.y)} ${fmt2Int(p1p2.angle * 180 / 3.1416)} ${fmt2Int(p1p2.h)}`
                +` start=${dbgfmtPt(p4)} end=${dbgfmtPt(p3)}`);
                drawRr(getRectPos(p2, p3));
                drawRr(getRectPos(p3, p4));
                drawRr(getRectPos(p4, p1));

            }else  if (mouse.state === 'released') {
                let x1 = p.mouseX;
                let y1 = p.mouseY;
                let x2 = core.states.mouse.pressLocation.x;
                let y2 = core.states.mouse.pressLocation.y;
                const w = halfWallWidth;
                const w2 = wallWidth;
                mouse.state = '';
                if (isFireMode) {
                    const ball = new SimpleCircle({
                        x: x2,
                        y: y2,
                        r: 10,
                        opts: { restitution: 0.5 },
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
                props.inputs[`setCurCollisionEnd`](`here`);
                
            //ray = Bodies.rectangle(rayX, rayY, rayLength, rayWidth, { angle: rayAngle }),
                if (x1 > x2) {
                    [x1,x2] = [x2,x1];
                }
                if (y1 > y2) {
                    [y1,y2] = [y2,y1];
                }                

                //props.inputs[`setCurCollisionEnd`](`x2-x1=${x2 - x1} y2-y1=${y2-y1}`);                
                
                return makeCell(endPoints);
                if (x2 - x1 < 10) return;
                props.inputs[`setCurCollisionEnd`](`herex`);
                if (y2 - y1 < 10) return;
                props.inputs[`setCurCollisionEnd`](`herey`);
                const x1x2 = x2-x1;
                const cx = x1x2/2;
                const y1y2 = y2-y1;
                const cy = y1y2/2;
                
                const hl1 = y1y2 -w2-w2;
                const opt = { restitution: 0.5, friction: 0.3, angularStiffness :0.9, collisionFilter:{mask:1} };


                const copt = label=>Object.assign({label, isSensor: true}, opt);
                const tb = new SimpleRect({ x: x1 + cx, y: y1 + w, w:x1x2-w2*2, h: w2, opts: copt('tb') }, core); //tl
                const bb = new SimpleRect({ x: x1 + cx, y: y2 - w, w:x1x2-w2*2, h: w2, opts: copt('bb') }, core); //tr
                const lb = new SimpleRect({ x: x1 + w, y: y1 + cy, w: w2, h: y1y2, opts: copt('lb') }, core); //bl
                const rb = new SimpleRect({ x: x2 - w, y: y1 + cy, w: w2, h: y1y2, opts: copt('rb') }, core); //br
                const addCst = cst=>{
                    createdEngine.addConstraint(cst);
                    core.constraints.push(cst);
                };
                const stiffness = .05;
                const pointA = {x:0,y:0};
                const pointB = pointA;
                addCst({bodyA: tb.body, bodyB: lb.body, pointA: { x: - cx + w, y: 0 }, pointB: {x: 0, y: -cy+w}, stiffness});
                addCst({bodyA: tb.body, bodyB: rb.body, pointA: { x: cx - w, y: 0}, pointB : { x:0, y: -cy+w}, stiffness});


                addCst({bodyA: bb.body, bodyB: lb.body, pointA:{  x: - cx + w, y: 0 }, pointB: {x: 0, y: cy-w}, stiffness});
                addCst({bodyA: bb.body, bodyB: rb.body, pointA:{  x: cx - w, y: 0 }, pointB: {x: 0, y: cy-w}, stiffness});

                return;
                //const tl = new SimpleRect({ x: x1 + w, y: y1 + w, w:w2, h: w2, opts: copt('tl') }, core); //tl
                //const tr = new SimpleRect({ x: x2 - w, y: y1 + w, w:w2, h: w2, opts: copt('tr') }, core); //tr
                //const bl = new SimpleRect({ x: x1 + w, y: y2 - w, w: w2, h: w2, opts: copt('bl') }, core); //bl
                //const br = new SimpleRect({ x: x2 - w, y: y2 - w, w: w2, h: w2, opts: copt('br') }, core); //br
                //const addCst = cst=>{
                //    createdEngine.addConstraint(cst);
                //    core.constraints.push(cst);
                //};
                //const stiffness = .05;
                //const pointA = {x:0,y:0};
                //const pointB = pointA;
                //addCst({bodyA: tl.body, bodyB: tr.body, pointA, pointB, stiffness});
                //addCst({bodyA: tl.body, bodyB: bl.body, pointA, pointB, stiffness});


                //addCst({bodyA: br.body, bodyB: bl.body, pointA, pointB, stiffness});
                //addCst({bodyA: br.body, bodyB: tr.body, pointA, pointB, stiffness});

                //addCst({bodyA: tl.body, bodyB: br.body, pointA, pointB, stiffness});

                return;


                const l1 = new SimpleRect({ x: x1 + w, y: y1 + cy, w:w2, h: hl1, opt }, core);
                const r1 = new SimpleRect({ x: x2 - w, y: y1 + cy, w:w2, h: hl1, opt }, core);
                const t1 = new SimpleRect({ x: x1 + cx, y: y1 + w , w: x1x2, h: w2, opt }, core);
                const b1 = new SimpleRect({ x: x1 + cx, y: y2 - w, w: x1x2, h: w2, opt }, core);
        
                const addCst1 = cst=>{
                    createdEngine.addConstraint(cst);
                    core.constraints.push(cst);
                };
                //const stiffness = 1;
                addCst({bodyA: l1.body, bodyB: t1.body, pointA: {x: 0, y: -(hl1/2) +1 }, pointB:{x:-cx +w, y:w-1}, stiffness});
                addCst({bodyA: l1.body, bodyB: b1.body, pointA: {x: 0, y:   hl1/2  - 1 }, pointB:{x:-cx +w, y:-w+1}, stiffness});


                addCst({bodyA: r1.body, bodyB: t1.body, pointA: {x: 0, y: -(hl1/2) + 1 }, pointB:{x:cx -w, y:w-1}, stiffness});
                addCst({bodyA: r1.body, bodyB: b1.body, pointA: {x: 0, y:   hl1/2  - 1 }, pointB:{x:cx -w, y:-w+1}, stiffness});

                addCst({bodyA: l1.body, bodyB: b1.body, pointA:{x:0, y:(-hl1/2)+w}, pointB:{x:cx -w, y:0}, stiffness});
                //addCst({bodyA: r1.body, bodyB: t1.body, pointA: {x:0, y: -y1y2/2 }, pointB:{x:x1x2/2 , y:w/2}, stiffness});
                //addCst({bodyA: r1.body, bodyB: b1.body, pointA: {x:0, y: y1y2/2 }, pointB:{x:x1x2/2 , y:-w/2}, stiffness});

                
                //addCst({bodyA: l1.body, bodyB: r1.body, pointA: {x:0, y: -y1y2/2 }, pointB:{x:0, y: y1y2/2 }, stiffness});
                //addCst({bodayA: r1, bodyB: t1, length: w2, stiffness: 0.9});
        
                //const cst = {bodyA: b1.body, bodyB: b2.body, length: 60, stiffness:0.9};                
                //engine.addConstraint(cst);
                //core.constraints.push(cst);
            }        
        }
        p.pop();
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
    new SimpleCircle({
        x: 210,
        y: 100,
        r: 30,
        opts: { restitution: 0.5 },
    }, core);

    new SimpleRect({
        x: 310,
        y: 100,
        w: 30,
        h: 60,
        opts: { restitution: 0.5 },
    }, core);
    const {addToWorld, Bodies} = createdEngine;
    const GroundHeight = 200;
    new SimpleRect({
        x: WIDTH/2,
        y: HEIGHT + GroundHeight/2-10,
        w: WIDTH,
        h: GroundHeight,
        opts: {isStatic: true, label: 'Ground'}
    }, core);
    //addToWorld([
    //  // walls      
    //  Bodies.rectangle(WIDTH/2, HEIGHT, WIDTH, 60, { isStatic: true })
    //])
}