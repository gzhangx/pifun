import { Vector } from "matter-js";
//import { core, WIDTH } from '../thisworld/consts';
import SimpleRect from './SimpleRect';
const w = 100;
const h = 20;


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

    const { addToWorld, Bodies } = createdEngine;
    const w1 = Bodies.circle(pos.x-(w/2)+10, pos.y+28, 10, opts);
    addToWorld(w1);
    const w2 = Bodies.circle(pos.x + (w / 2) -10, pos.y+28, 10, opts);
    addToWorld(w2);
    const stiffness = 0.9;
    const wws = [w1, w2]
    const getCst = (who, mul=1) => {
        return { bodyA: wws[who], bodyB: rc.body, pointA: {x:0,y:0}, pointB: {x: (who?(w/2):(-w/2))*mul,y:0}, stiffness };
    };
    core.worldCon.addCst(getCst(0));
    core.worldCon.addCst(getCst(0,0));
    core.worldCon.addCst(getCst(1));
    core.worldCon.addCst(getCst(1,0));
}
