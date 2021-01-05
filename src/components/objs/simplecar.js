import { Vector } from "matter-js";
//import { core, WIDTH } from '../thisworld/consts';
import SimpleRect from './SimpleRect';
import CreateSimpleCircle from './SimpleCircle';
const w = 200;
const h = 40;


export function createCar(opt, pos) {    
    const core = opt.core;    
    const { createdEngine } = core;
    const { side } = opt;
    const opts = null;//{ restitution: 0.5, collisionFilter: core.worldCats.getCat(side).structure.getCollisionFilter() };

    const rc = new SimpleRect({
        x: pos.x,
        y: pos.y,
        w,
        h,
        ggOpts: {
            label: 'Car',
            h,
        },
        opts,
    }, createdEngine);

    const { addToWorld, Bodies, Body } = createdEngine;
    const wheelR = 20;
    const w1 = CreateSimpleCircle({ x: pos.x - (w / 2) + wheelR, y: pos.y + (wheelR / 2) + (h / 2) + 20, r: wheelR, opts },
    createdEngine);
    //addToWorld(w1);
    const w2 = CreateSimpleCircle({
        x: pos.x + (w / 2) - wheelR, y: pos.y + (wheelR / 2) + (h / 2) + 20, r: wheelR, opts
    }, createdEngine);
    //addToWorld(w2);
    Body.applyForce(w1, {x:0, y:1}, {x:0.001, y:0.001})
    
    const stiffness = 0.1;
    const wws = [w1, w2];
    wws.forEach(w => {
        w.ggInfo = Object.assign({}, rc.body.ggInfo, {
            isTestWheel: true,
            forceLeftRight: lr => Body.applyForce(w, { x: w.position.x, y: w.position.y + 1 }, { x: 0.01*lr, y: 0 })
        });
    })
    rc.body.ggInfo.wheels = wws;
    const getCst = (who, mul=1) => {
        return { bodyA: wws[who], bodyB: rc.body, pointA: {x:0,y:0}, pointB: {x: (who?(w/2-wheelR):(-w/2+wheelR))*mul,y:0}, stiffness };
    };
    core.worldCon.addCst(getCst(0));
    core.worldCon.addCst(getCst(0,0));
    core.worldCon.addCst(getCst(1));
    core.worldCon.addCst(getCst(1,0));
}
