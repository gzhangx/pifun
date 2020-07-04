import Matter from "matter-js";
const allCllisionFilter = {
  category: 0x0001,
  mask: 0xFFFFFFFF,
  group: 0
};

// Thanks Gavin from https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
function getIntersection(l1, l2) {
  const p0_x = l1.p1.x;
  const p0_y = l1.p1.y;
  const p1_x = l1.p2.x, p1_y = l1.p2.y;
  const p2_x = l2.p1.x, p2_y = l2.p1.y, p3_x = l2.p2.x, p3_y = l2.p2.y;
  const s1_x = p1_x - p0_x;     
  const s1_y = p1_y - p0_y;
  const s2_x = p3_x - p2_x;
  const s2_y = p3_y - p2_y;

  const denom = (-s2_x * s1_y + s1_x * s2_y);
  if (denom === 0) return null;
  const s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / denom;
  const t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / denom;

  if (s >= 0 && s <= 1 && t >= 0 && t <= 1)
  {
      // Collision detected
      return {
        s,
        t,
        x: p0_x + (t * s1_x),
        y: p0_y + (t * s1_y),
      }      
  }
  return null;
}

function getBodiesUnderPos(eng, position, returnFirst = true) {
  const {Bounds, Vertices, Detector, engine} = eng;
  const bodies = engine.world.bodies;
  const all = [];
  for (var i = 0; i < bodies.length; i++) {
    const body = bodies[i];
    if (Bounds.contains(body.bounds, position) ) {
        for (let j = body.parts.length > 1 ? 1 : 0; j < body.parts.length; j++) {
            const part = body.parts[j];
            if (Vertices.contains(part.vertices, position)) {
              if (returnFirst)
                return body;
              all.push(body);              
            }
        }
    }
  }  
  if (returnFirst) return all[0];
  return all;
}

const sortAsc = (a,b)=>a.t-b.t;
export function createEngine() {
    const Engine = Matter.Engine,
      //Render = Matter.Render,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Bounds = Matter.Bounds,
      Composite = Matter.Composite,
      Common = Matter.Common,
      Constraint = Matter.Constraint,
      Detector = Matter.Detector,
      Events = Matter.Events,    
      Vector = Matter.Vector,
      Vertices = Matter.Vertices,      
      Query = Matter.Query
      ;      
    
    const engine = Engine.create({
      // positionIterations: 20
      constraintIterations: 5,
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
        Bodies,
        Body,
        Bounds,
        Common,
        Composite,
        Constraint,
        Detector,
        Events,
        Matter,
        Vector,
        Vertices,
        Query,
        engine,
        addToWorld: body=>World.add(engine.world, body),
      removeFromWorld: body => {
          if (body.ggConstraints) {
            body.ggConstraints.forEach(c => {
              World.remove(engine.world, c);
            })
          }
          World.remove(engine.world, body);
        },
        addConstraint: cst=>World.add(engine.world, Constraint.create(cst)),
        eventCallbacks,
        setBodyOuterParent: (bdy, parent) => bdy.ggParent = parent,
        setBodyGGInfo: (bdy, info) => bdy.ggInfo = info, //will replace setBodyOuterParent
        rayQuery: (startPoint, endPoint, bodies)=>{
          if (!bodies) bodies = Composite.allBodies(engine.world);
          return Query.ray(bodies, startPoint, endPoint);
        },
        getIntersection,
        rayQueryWithPoints: (startPoint, endPoint, bodies, first = true)=>{
          if (!bodies) bodies = Composite.allBodies(engine.world);
          const l1 = {p1: startPoint, p2: endPoint};
          return bodies.map(b=>{
            const pts = b.vertices.reduce((acc, c)=>{
              const cs = getIntersection(l1,{
                p1: acc.last,
                p2: c,
              });
              if (cs) {
                cs.body = b;
                acc.secs.push(cs);
              }
              acc.last = c;
              return acc;
            }, { last: b.vertices[b.vertices.length - 1], secs: []});
            if (pts.secs.length) {
              pts.secs.sort(sortAsc);
              if (first) return pts.secs[0];
              return pts.secs;
            }
          }).filter(x=>x).sort(sortAsc);
        }
    }
    created.getBodiesUnderPos = pos=>getBodiesUnderPos(created, pos);
    return created;
}