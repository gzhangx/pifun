import Matter from "matter-js";
import p5 from "p5";
export function createEngine() {
    const Engine = Matter.Engine,
      //Render = Matter.Render,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Events = Matter.Events,
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
    return {
        World,
        Matter,
        engine,
        Bodies,
        Constraint,
        addToWorld: body=>World.add(engine.world, body),
        addConstraint: cst=>World.add(engine.world, Constraint.create(cst)),
        eventCallbacks,
    }
}


export const setup= (drawCanv, world, engine, props)=>{ 
  const Sketch = p => {
      p.setup = ()=>world.setup(p, engine, drawCanv);

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
