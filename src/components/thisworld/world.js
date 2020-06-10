import SimpleCircle from '../objs/SimpleCircle';
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
            switch (type) {
                case 'SimpleRect':
                    const size = radius *2;                    
                    p.rect(body.position.x - radius , body.position.y - radius , size,size);
                    break;
                case 'SimpleCircle':
                    item.show(p);
                    break;
            }
        });
    },
    mousePressed: p=>{
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