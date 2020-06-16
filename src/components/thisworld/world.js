import SimpleCircle from '../objs/SimpleCircle';
import SimpleSqure from '../objs/SimpleSqure';
export const allBodies = [];
export const WIDTH = 600;
export const HEIGHT = 600;

const core = {
    allBodies,
    constraints: [],
    collisions:[],
}
let engine ;
export default  {
    WIDTH,
    HEIGHT,
    core,
    setup: (p, eng, canvas)=>{
        p.createCanvas(WIDTH, HEIGHT);
        engine = eng;
        const {Mouse, MouseConstraint} = eng.Matter;
        eng.eventCallbacks.collisionEvent = (e)=>{            
            
            if (e.name === 'collisionActive' || e.pairs.length) {
                core.collisions = e.pairs;                
            }
        };
        const mouse = Mouse.create(canvas),        
        mouseConstraint = MouseConstraint.create(engine.engine, {
            mouse,
            constraint: {
                stiffness: 0.2,                
            }
        });

        eng.addToWorld(mouseConstraint);

        core.addToWorld = eng.addToWorld;        
        core.Bodies = eng.Bodies;
        createWorld();
    },
    draw: p=>{
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
            engine.addConstraint(cst);
            core.constraints.push(cst);
            return;
        }
        p.background(56);
        p.fill(255);
        allBodies.forEach(item=>{
            const {body, type, radius } = item;
            item.show(p);            
        });
        core.constraints.forEach(cst=>{
            const p1 = cst.bodyA.position;
            const p2 = cst.bodyB.position;
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
        p.pop();
    },
    mousePressed: p=>{
return;
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
        engine.addConstraint(cst);
        core.constraints.push(cst);
        return;

        new SimpleCircle({
            x: p.mouseX,
            y: p.mouseY,
            r: 30,
            opt: { restitution: 0.5 },
        }, core);

        
        //const body = core.Bodies.circle(p.mouseX, p.mouseY, 30, { restitution: 0.7 });
        //allBodies.push({
        //    type: 'SimpleCircle',
        //    body,
        //});        
        //core.addToWorld(body);
        //World.add(engine.
    }
};

export function createWorld() {    
    new SimpleCircle({
        x: 210,
        y: 100,
        r: 30,
        opt: { restitution: 0.5 },
    }, core);
    const {addToWorld, Bodies} = engine;
    addToWorld([
      // walls      
      Bodies.rectangle(WIDTH/2, HEIGHT, WIDTH, 60, { isStatic: true })
    ])
}