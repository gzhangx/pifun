import Matter from "matter-js";
import p5 from "p5";
const allCllisionFilter = {
  category: 0x0001,
  mask: 0xFFFFFFFF,
  group: 0
};


function getBodiesUnderPos(eng, position) {
  const {Bounds, Vertices, Detector, engine} = eng;
  const bodies = engine.world.bodies;
  for (var i = 0; i < bodies.length; i++) {
    const body = bodies[i];
    if (Bounds.contains(body.bounds, position) 
            && Detector.canCollide(body.collisionFilter, allCllisionFilter)) {
        for (let j = body.parts.length > 1 ? 1 : 0; j < body.parts.length; j++) {
            const part = body.parts[j];
            if (Vertices.contains(part.vertices, position)) {
                return body;
            }
        }
    }
}
}
export function createEngine() {
    const Engine = Matter.Engine,
      //Render = Matter.Render,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Events = Matter.Events,
      Bounds = Matter.Bounds,
      Vertices = Matter.Vertices,
      Detector = Matter.Detector,
      Constraint = Matter.Constraint      
      ;      
    
    const engine = Engine.create({
      // positionIterations: 20
    });

    const collisionEvents = ['collisionStart','collisionActive','collisionEnd'];
    const eventCallbacks = {};
    collisionEvents.forEach(eventName=>{
      Events.on(engine, eventName, event=> {
        //event.pairs[i].bodyA/bodyB;
        const cb = eventCallbacks.collisionEvent;
        return cb && cb(event);
      });
    });
    
    Engine.run(engine);
    //World.add(engine.world, [
      // walls      
    //  Bodies.rectangle(WIDTH/2, HEIGHT, WIDTH, 60, { isStatic: true })
    //]);
    const created = {
        World,
        Matter,
        engine,
        Bodies,
        Body,
        Bounds,
        Vertices,
        Detector,
        Constraint,
        addToWorld: body=>World.add(engine.world, body),
        removeFromWorld: body=>World.remove(engine.world, body),
        addConstraint: cst=>World.add(engine.world, Constraint.create(cst)),
        eventCallbacks,
        setBodyOuterParent: (bdy, parent)=>bdy.ggParent = parent,
    }
    created.getBodiesUnderPos = pos=>getBodiesUnderPos(created, pos);
    return created;
}


export const setup= (drawCanv, world, createdEngine, props)=>{ 
  const Sketch = p => {
      p.setup = ()=>world.setup(p, createdEngine, drawCanv);

      p.draw = () => world.draw(p, props);        

      p.mousePressed = ()=>{
        world.mousePressed(p);            
      }
      p.mouseDragged = ()=>{
        world.mouseDragged(p);
      }
      p.mouseReleased = ()=>{
        world.mouseReleased(p);
      }
  }
  const myP5 = new p5(Sketch, drawCanv);
  return {
      ref: myP5,
  }
}
