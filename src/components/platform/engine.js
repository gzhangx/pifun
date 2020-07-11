import Matter from "matter-js";
const Vector = Matter.Vector;
const allCllisionFilter = {
  category: 0x0001,
  mask: 0xFFFFFFFF,
  group: 0
};

export const PId2 = -Math.PI / 2
export function getDispAng(angle) { return angle + PId2; }
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

export function getBodiesUnderPos(eng, position, returnFirst = true) {
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

//line and pp
export function getProjectionPoint(p1, p2, pp) {
  //http://www.sunshine2k.de/coding/java/PointOnLine/PointOnLine.html
  const e1 = Vector.sub(p2, p1);
  const e2 = Vector.sub(pp, p1);
  const dp = Vector.dot(e1, e2);
  const inRange = dp > 0 && dp < Vector.dot(e1, e1);
  const e1Len = Vector.magnitude(e1);
  if (e1Len === 0) {
    return null;
  }
  const e2Len = Vector.magnitude(e2);
  const cos = dp / (e1Len * e2Len);
  const projectedLen = cos * e2Len;
  return {
    inRange,
    x: p1.x + ((projectedLen * e1.x) / e1Len),
    y: p1.y + ((projectedLen * e1.y) / e1Len),
  };
}


export function checkPointBetweenOnLine({ p1, p2 }, pp) {
  const dl = Vector.sub(p2, p1);
  const pl = Vector.sub(pp, p1);
  if (dl.y !== 0) {
    const d = pl.y / dl.y;
    if (d < 0 || d > 1) return false;
  }
  if (dl.x !== 0) {
    const d = pl.x / dl.x;
    if (d < 0 || d > 1) return false;
  }
  return true;
}
//will rotate first one
export function stickRect2Body({ x, y, w, h }, body) {
  const w2 = w / 2;
  const getAngle = ang => !ang ? -Math.PI / 2 : ang;
  const angle = getDispAng((body.angle));
  const queryInfo = rayQueryOnOneBody({ p1: { x, y }, p2: body.position }, body);
  if (!queryInfo) return;
  const { p1, p2 } = queryInfo.edge;
  const projPt = getProjectionPoint(p1, p2, { x, y });
  if (projPt && projPt.inRange) {
    const vc = Vector.sub({ x, y }, projPt);
    const fullLen = Vector.magnitude(vc);
    if (fullLen === 0) return;
    const cr = h / 2 / fullLen;
    const newC = {
      x: projPt.x + (cr * vc.x),
      y: projPt.y + (cr * vc.y),
      w,
      h,
    }

    const fromEnd1 = {
      x: projPt.x + (w2 * Math.cos(angle)),
      y: projPt.y + (w2 * Math.sin(angle)),
    };
    const fromEnd2 = {
      x: projPt.x - (w2 * Math.cos(angle)),
      y: projPt.y - (w2 * Math.sin(angle)),
    };

    const goodPts = [];
    const fromLine = {
      p1: fromEnd1,
      p2: fromEnd2,
    };
    if (checkPointBetweenOnLine(fromLine, p1)) {
      goodPts.push(p1);
    }
    if (checkPointBetweenOnLine(fromLine, p2)) {
      goodPts.push(p2);
    }
    if (checkPointBetweenOnLine(queryInfo.edge, fromEnd1)) {
      goodPts.push(fromEnd1);
    }
    if (checkPointBetweenOnLine(queryInfo.edge, fromEnd2)) {
      goodPts.push(fromEnd2);
    }

    return {
      body,
      queryInfo,
      projPt,      
      fromEnd1,
      fromEnd2,
      newC,
      goodPts,
    }
  }
}


const sortAsc = (a, b) => a.t - b.t;

export function rayQueryOnOneBody(l1, b, first = true) 
{
  const { p1, p2 } = l1;
  const pts = b.vertices.reduce((acc, c) => {
    const l2 = {
      p1: acc.last,
      p2: c,
    };
    const cs = getIntersection(l1, l2);
    if (cs) {
      cs.body = b;
      cs.edge = l2;
      acc.secs.push(cs);
    }
    acc.last = c;
    return acc;
  }, { last: b.vertices[b.vertices.length - 1], secs: [] });
  if (pts.secs.length) {
    pts.secs.sort(sortAsc);
    if (first) return pts.secs[0];
    return pts.secs;
  }
}

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
    Vertices = Matter.Vertices,
    Query = Matter.Query
    ;
    
  const engine = Engine.create({
    // positionIterations: 20
    constraintIterations: 5,
  });

  const collisionEvents = ['collisionStart', 'collisionActive', 'collisionEnd'];
  const eventCallbacks = {};
  collisionEvents.forEach(eventName => {
    Events.on(engine, eventName, event => {
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
    addToWorld: body => World.add(engine.world, body),
    removeFromWorld: body => {
      if (body.ggConstraints) {
        body.ggConstraints.forEach(c => {
          World.remove(engine.world, c);
        })
      }
      World.remove(engine.world, body);
    },
    addConstraint: cst => World.add(engine.world, Constraint.create(cst)),
    eventCallbacks,
    setBodyOuterParent: (bdy, parent) => bdy.ggParent = parent,
    setBodyGGInfo: (bdy, info) => bdy.ggInfo = info || {}, //will replace setBodyOuterParent
    rayQuery: (startPoint, endPoint, bodies) => {
      if (!bodies) bodies = Composite.allBodies(engine.world);
      return Query.ray(bodies, startPoint, endPoint);
    },
    getIntersection,
    getProjectionPoint,
    //returns s, t, x, y , body and edge(p1,p2) that was hit
    rayQueryWithPoints: (startPoint, endPoint, bodies, first = true) => {
      if (!bodies) bodies = Composite.allBodies(engine.world);
      const l1 = { p1: startPoint, p2: endPoint };
      return bodies.map(b => rayQueryOnOneBody(l1, b, first)).filter(x => x).sort(sortAsc);
    }
  }
  created.getBodiesUnderPos = pos => getBodiesUnderPos(created, pos);
  return created;
}