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
    }
}
let createdEngine ;
export default  {
    WIDTH,
    HEIGHT,
    core,
    setup: (p, engineCreated, canvas)=>{
        p.createCanvas(WIDTH, HEIGHT);
        createdEngine = engineCreated;
        const {Mouse, MouseConstraint} = createdEngine.Matter;
        createdEngine.eventCallbacks.collisionEvent = (e)=>{            
            
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

        //if (props.curBuildType === 'wall') 
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
            if (mouse.state === 'dragged') {
                p.stroke(128);
                p.strokeWeight(2);
                p.line(mouse.pressLocation.x, mouse.pressLocation.y, mouse.cur.x, mouse.cur.y);
            }else  if (mouse.state === 'released') {
                mouse.state = '';
                if (mouse.bodyFound) return;
                let x1 = p.mouseX;
                let y1 = p.mouseY;
                let x2 = core.states.mouse.pressLocation.x;
                let y2 = core.states.mouse.pressLocation.y;
                if (x1 > x2) {
                    [x1,x2] = [x2,x1];
                }
                if (y1 > y2) {
                    [y1,y2] = [y2,y1];
                }                
                if (x2 - x1 < 10) return;
                if (y2 - y1 < 10) return;                
                
                const x1x2 = x2-x1;
                const cx = x1x2/2;
                const y1y2 = y2-y1;
                const cy = y1y2/2;
                const w = 12;
                const w2 = w*2;
                const hl1 = y1y2 -w2-w2;
                const opt = { restitution: 0.5, friction: 0.3, angularStiffness :0.9 };


                const copt = label=>Object.assign({label}, opt);
                const tl = new SimpleRect({ x: x1 + w, y: y1 + w, w:w2, h: w2, opts: copt('tl') }, core); //tl
                const tr = new SimpleRect({ x: x2 - w, y: y1 + w, w:w2, h: w2, opts: copt('tr') }, core); //tr
                const bl = new SimpleRect({ x: x1 + w, y: y2 - w, w: w2, h: w2, opts: copt('bl') }, core); //bl
                const br = new SimpleRect({ x: x2 - w, y: y2 - w, w: w2, h: w2, opts: copt('br') }, core); //br
                const addCst = cst=>{
                    createdEngine.addConstraint(cst);
                    core.constraints.push(cst);
                };
                const stiffness = .05;
                const pointA = {x:0,y:0};
                const pointB = pointA;
                addCst({bodyA: tl.body, bodyB: tr.body, pointA, pointB, stiffness});
                addCst({bodyA: tl.body, bodyB: bl.body, pointA, pointB, stiffness});


                addCst({bodyA: br.body, bodyB: bl.body, pointA, pointB, stiffness});
                addCst({bodyA: br.body, bodyB: tr.body, pointA, pointB, stiffness});

                addCst({bodyA: tl.body, bodyB: br.body, pointA, pointB, stiffness});

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