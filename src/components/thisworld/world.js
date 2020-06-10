import SimpleCircle from '../objs/SimpleCircle';
import SimpleSqure from '../objs/SimpleSqure';
export const allBodies = [];
export const WIDTH = 600;
export const HEIGHT = 600;

const core = {
    allBodies,
}
export default  {
    WIDTH,
    HEIGHT,
    setup: (p, eng)=>{
        p.createCanvas(WIDTH, HEIGHT);
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
    },
    mousePressed: p=>{

        return new SimpleSqure({
            x: p.mouseX,
            y: p.mouseY,
            w: 30,
            opt: { restitution: 0.5,
            friction: 0.3 },
        }, core);

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
    const {addToWorld, Bodies} = core;
    addToWorld([
      // walls      
      Bodies.rectangle(WIDTH/2, HEIGHT, WIDTH, 60, { isStatic: true })
    ])
}