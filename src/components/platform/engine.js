import Matter from "matter-js";
import p5 from "p5";
export function createEngine() {
    const Engine = Matter.Engine,
      //Render = Matter.Render,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Constraint = Matter.Constraint
      ;      

    const engine = Engine.create({
      // positionIterations: 20
    });

    Engine.run(engine);
    //World.add(engine.world, [
      // walls      
    //  Bodies.rectangle(WIDTH/2, HEIGHT, WIDTH, 60, { isStatic: true })
    //]);
    return {
        World,
        engine,
        Bodies,
        Constraint,
        addToWorld: body=>World.add(engine.world, body),
        addConstraint: cst=>World.add(engine.world, Constraint.create(cst)),
    }
}


export const setup= (drawCanv, world, engine)=>{ 
  const Sketch = p => {
      p.setup = ()=>world.setup(p, engine);

      p.draw = () => world.draw(p);        

      p.mousePressed = ()=>{
        world.mousePressed(p);            
      }
  }
  const myP5 = new p5(Sketch, drawCanv);
  return {
      ref: myP5,
  }
}
