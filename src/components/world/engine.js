import Matter from "matter-js";
export function createEngine() {
    const Engine = Matter.Engine,
      //Render = Matter.Render,
      World = Matter.World,
      Bodies = Matter.Bodies;      

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
        addToWorld: body=>World.add(engine.world, body),
    }
}
