import SimpleCircle from '../objs/SimpleCircle';
import SimpleRect from '../objs/SimpleRect';

import { initWorld, getMouse } from './worldConstructor';

import { showCannonHolder, createCannon } from '../objs/Cannon';
import { createCar} from '../objs/simplecar';
import { postRender } from './unitui';
import { get } from 'lodash';

const MAX_WALL_WIDTH = 200;
const MAX_WALL_HEIGHT = 200;
//export const allBodies = [];

function doWallSketch(core, fromPt, cur) {
    const { HEIGHT, wallWidth } = core.consts;
    const {rayQueryWithPoints} = core.createdEngine;
    const startPt = rayQueryWithPoints({x:fromPt.x, y:fromPt.y},{x: fromPt.x, y: HEIGHT});
    startPt.forEach(r=>{                        
        //props.inputs[`setCurCollisionStart`](`${r.x.toFixed(2)}/${r.y.toFixed(2)} `);
        //p.push();
        //p.translate(r.x, r.y);
        //p.text(r.t.toFixed(2), 0,0);        
        //p.rectMode(p.CENTER);
        //p.stroke('ff0000');
        //p.strokeWeight(2);
        //p.fill('0000ff');                    
        //p.rect(2,2, 4, 4);
        //p.pop();
    });

    const endpt = rayQueryWithPoints({x:cur.x, y:cur.y},{x: cur.x, y: HEIGHT});
    const start = startPt[0];
    return {
        ok: Math.abs(cur.x - fromPt.x) > wallWidth * 2 && start,
        start,
        end: endpt[0],
    }
}

export default  {
    //WIDTH,
    //HEIGHT,
    setup: (canvas, props, core) => {
        const { WIDTH, HEIGHT } = core.consts;
        initWorld(core, {
            canvas, run, props,
            renderOpts: {
                showAxes: true,
                hasBounds: true,
                width: WIDTH,
                height: HEIGHT,
                postRender,
                core,
            },
        });
        createWorld(core);
        return core;
    },    
};

const screenOff = {
    x: 0,
    y: 0,
}

const arrowDir = {
    ArrowRight: 1,
    ArrowLeft: -1,
}
function run(core, props) {
    const {
        WALLHEALTH,
    } = core.consts;
    //const { props } = opt;
    const { curBuildType } = core.inputs;
    const { setCurDebugText } = props.inputs;
    const isWallMode = curBuildType === 'wall';
    const isFireMode = curBuildType === 'fire';
    const isCannonMode = curBuildType === 'cannon';
    const isConnection = curBuildType === 'connection';
    const isSelect = curBuildType === 'select';
    const isCircle = curBuildType === 'circle';
    const isRectangle = curBuildType === 'rectangle';
    const { mouseConstraint } = core;
    
    //const mouse = core.states.mouse;
    const mouse = core.getCurPlayerInputState().mouse;
    mouseConstraint.disabled = !isSelect && mouse.pressLocation;
    const { engine, rayQueryWithPoints, Vector, Composite, Body } = core.createdEngine;
    const { getDragCellPoints, makeCell, worldOperations,
        doSelect,
        doDragDrop,
        showSelect,
        doTranslate,
        doFireBall,
        checkWallPoints,
    } = core.worldCon;
    //removeBadBodies();
    //processCollisions(core);
    worldOperations();
    const allBodies = Composite.allBodies(engine.world);


    const c = core.render.context;
    const side = core.inputs.curSide;
    const key = core.inputs.loopKey;
    
    setCurDebugText("key=" + core.inputs.lastKey + ` bodyCnt=${allBodies.length} cnsts=${Composite.allConstraints(engine.world).length}`);
    

    
    if (key === 'c' || key === 'v') {
        if (key === 'c') screenOff.y += 10;
        if (key === 'v') screenOff.y -= 10;
        core.inputs.loopKey = '';
        doTranslate(screenOff);
    }

    if (arrowDir[key]) {
        const dir = arrowDir[key];
        // allBodies.forEach(b => {
        //     const isTestWheel = get(b, 'ggInfo.isTestWheel');
        //     if (isTestWheel) {
        //         Body.applyForce(b, { x: b.position.x, y: b.position.y + 1 }, { x: 0.01, y: 0 })
        //         console.log(`${b.position.x} ${b.position.y}`)
        //     }
        // })
        const selected = core.selectObj.cur;
        if (selected && selected.ggInfo) {
            if (selected.ggInfo.forceLeftRight) {
                selected.ggInfo.forceLeftRight(dir)
            } else if (selected.ggInfo.wheels) {
                selected.ggInfo.wheels.forEach(w => {
                    if (w.ggInfo.forceLeftRight) {
                        w.ggInfo.forceLeftRight(dir);
                    }
                })
            }
        }
    }
    //if (core.inputs.curBuildType === 'wall') 

    if (isSelect) {
        doSelect();
        //props.inputs.setUISelectedObj(core.selectObj);
    }
    doDragDrop(core);
    core.uiDspInfo.selectInfo = showSelect({ isSelect, key, side });
    if (isCannonMode && mouse.state === 'dragged') {
        core.uiDspInfo.cannonHolder = showCannonHolder({ c, core, allBodies, setCurDebugText }, {
            x: mouse.cur.x,
            y: mouse.cur.y,
        })
    }
    if (!mouse.pressLocation) return;
    if (!mouse.cur) return;

    if (mouse.state === 'dragged') {
        if (isFireMode || isConnection) {
            core.uiDspInfo.fireDirInfo = {
                from: getMouse(mouse.pressLocation),
                to: getMouse(mouse.cur),
            };
        }

        if (isWallMode) {
            rayQueryWithPoints({ x: mouse.pressLocation.x, y: mouse.pressLocation.y }, { x: mouse.cur.x, y: mouse.cur.y });
            //props.inputs[`setCurCollisionStart`](`${dists} `);                    
            const endPoints = doWallSketch(core, mouse.pressLocation, mouse.cur);
            if (!endPoints.ok || !endPoints.end) return;

            const wallPts = getDragCellPoints(mouse.pressLocation, mouse.cur, endPoints);
            core.states.lastGoodWallPts = null;
            core.uiDspInfo.wallPts = wallPts;
            const totalWallLen = checkWallPoints(wallPts);
            if (totalWallLen !== null) {
                setCurDebugText(`walllen=${totalWallLen}`);
            }
            //drawCellPointsCnv(wallPts);
        }

        if (isCircle || isRectangle) {
            const diff = Vector.sub(mouse.pressLocation, mouse.cur);
            const r = Vector.magnitude(diff);
            core.uiDspInfo.editorObj = {
                type: isCircle ? 'circle' : 'rectangle',
                x: mouse.cur.x,
                y: mouse.cur.y,
                r: r,
                w: Math.abs(diff.x),
                h: Math.abs(diff.y)
            }
        }

    } else if (mouse.state === 'released') {
        mouse.state = '';
        const mouseFrom = getMouse(mouse.pressLocation);
        const mouseCur = getMouse(mouse.cur);
        core.states.mouse.pressLocation = null;
            
        if (isCannonMode) {
            createCannon({ core, allBodies, side }, mouseCur);
        }
        if (curBuildType === 'gmakecar') {
            createCar({core, allBodies, side}, mouseCur)
        }
        if (isConnection) {
            const bodyA = core.createdEngine.getBodiesUnderPos(mouse.cur);
            if (!bodyA) return;
            const pointA = { x: mouse.cur.x - bodyA.position.x, y: mouse.cur.y - bodyA.position.y };
            const pointB = Vector.sub(mouseFrom, mouseConstraint.body.position);
            core.worldCon.addCst({ bodyB: mouseConstraint.body, bodyA, pointB, pointA });
        }
        if (isFireMode) {
            if (!mouseFrom) return;
            return doFireBall(mouseFrom, mouseCur, side);
        }

        if (isWallMode) {
            const endPoints = doWallSketch(core, mouseFrom, mouseCur);
            if (!endPoints.ok || !endPoints.end) return;
            const wallPts = getDragCellPoints(mouseFrom, mouseCur, endPoints);
            if (wallPts && wallPts.connects && wallPts.connects.length) {
                core.uiDspInfo.wallPts = wallPts;
                //drawCellPointsCnv(wallPts);
                const allWalls=makeCell(wallPts.connects,endPoints,core.worldCats.getCat(side).structure.getCollisionFilter(),
                    {
                        side,
                        player: side + 1,
                });
                allWalls.forEach(w => w.health = WALLHEALTH);
                return allWalls;
            }
        }

        if (curBuildType === 'circle') {
            const r = Vector.magnitude(Vector.sub(mouse.pressLocation, mouse.cur));
            const { x, y } = mouse.cur;            

            const sdata = {
                x, y, r,
                opts: { restitution: 0.5, },
            };
            const c = new SimpleCircle(Object.assign({}, sdata, {
                ggOpts: {
                    isDesignerItem: true,
                },                
            }), core.createdEngine);
            if (core.inputs.isDesignMode) {
                c.body.ggInfo.funcs.addDesignCst = pointA => {
                    core.worldCon.addCst({ bodyB: c.body, pointA, pointB: { x: 0, y: 0 } });    
                }
                c.body.ggInfo.funcs.addDesignCst({ x, y });
                //core.worldCon.addCst({ bodyB: c.body, pointA: { x, y }, pointB: { x: 0, y: 0 } });
                sdata.body = c.body;
                core.designerData.items.push(sdata);
            }
        } else if (curBuildType === 'rectangle') {
            const diff = Vector.sub(mouse.pressLocation, mouse.cur);
            const w = Math.abs(diff.x);
            const h = Math.abs(diff.y);
            const sdata = {
                x: mouse.pressLocation.x + w / 2,
                y: mouse.pressLocation.y + h / 2,
                w,
                h,                
                opts: { restitution: 0.5, },
            };
            const c = new SimpleRect(Object.assign({                
                ggOpts: {
                    isImmortal: false,
                    isDesignerItem: true,
                },                
            }, sdata), core.createdEngine)
            if (core.inputs.isDesignMode) {
                const addDesignCst = ({ x, y }, wh) => {
                    const wi = wh || { w, h };
                    core.worldCon.addCst({ bodyB: c.body, pointA: { x: x-(w/2), y }, pointB: { x: -wi.w / 2, y: 0 } });
                    core.worldCon.addCst({ bodyB: c.body, pointA: { x: x + (w/2), y }, pointB: { x: wi.w / 2, y: 0 } });    
                }
                c.body.ggInfo.funcs.addDesignCst = addDesignCst;
                const y = mouse.pressLocation.y + (h / 2);
                const x = mouse.pressLocation.x + (w/2);
                addDesignCst({ x, y });
                //core.worldCon.addCst({ bodyB: c.body, pointA: { x: mx, y: cy }, pointB: { x: -w / 2, y: 0 } });
                //core.worldCon.addCst({ bodyB: c.body, pointA: { x: mx + w, y: cy }, pointB: { x: w / 2, y: 0 } });
                sdata.body = c.body;
                core.designerData.items.push(sdata);
            }
        }
    }
    
}


function createWorld(core) {

    //(categoryA & maskB) !== 0 and (categoryB & maskA) !== 0    
    //const { addToWorld, Bodies, Body } = core.createdEngine;
    const { worldCats, createdEngine, consts } = core;
    const { WIDTH, HEIGHT} = consts;
    
    new SimpleCircle({
        x: 210,
        y: 100,
        r: 30,
        ggOpts: {
            isImmortal: false,
        },
        opts: { restitution: 0.5, collisionFilter: worldCats.ground.structure.getCollisionFilter()},
    }, createdEngine);

    new SimpleRect({
        x: 310,
        y: 100,
        w: 30,
        h: 60,
        ggOpts: {
            h: 60,
        },
        opts: { restitution: 0.5, collisionFilter: worldCats.ground.structure.getCollisionFilter()},
    }, createdEngine);
    
    const GroundHeight = 200;
    new SimpleRect({
        x: WIDTH/2,
        y: HEIGHT + GroundHeight/2- 10,
        w: WIDTH,
        h: GroundHeight,
        ggOpts: {
            isImmortal: true,
            h: GroundHeight,
            player: 'groundPerm'
        },
        opts: { isStatic: true, label: 'Ground', collisionFilter: worldCats.ground.structure.getCollisionFilter()},
    }, createdEngine);


    //addToWorld([
    //  // walls      
    //  Bodies.rectangle(WIDTH/2, HEIGHT, WIDTH, 60, { isStatic: true })
    //])
}