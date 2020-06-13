import SimpleCircle from '../objs/SimpleCircle';
import SimpleSqure from '../objs/SimpleSqure';
export const allBodies = [];
export const WIDTH = 600;
export const HEIGHT = 600;

const core = {
    allBodies,
    constraints: [],
}
let engine ;
export default  {
    WIDTH,
    HEIGHT,
    setup: (p, eng)=>{
        p.createCanvas(WIDTH, HEIGHT);
        engine = eng;
        core.addToWorld = eng.addToWorld;        
        core.Bodies = eng.Bodies;
        createWorld();
    },
    draw: p=>{
        p.background(0);
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
    },
    mousePressed: p=>{

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
        const cst = {bodyA: b1.body, bodyB: b2.body, stiffness:0.9};
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