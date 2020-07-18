import SimpleCircle from '../objs/SimpleCircle';
import SimpleRect from '../objs/SimpleRect';

import { initWorld, getMouse } from './worldConstructor';

import { showCannonHolder, createCannon } from '../objs/Cannon';
import { postRender } from './unitui';

//export const allBodies = [];

function doWallSketch(core, fromPt, cur) {
    const { HEIGHT, wallWidth, WIDTH } = core.consts;
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

const dbgfmtPt = (p, fixed = 0) => p ? `(${p.x.toFixed(fixed)}/${p.y.toFixed(0)})` : 'NA';
const fmt2Int = p => parseInt(p);
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
function run(core, props) {
    const { WIDTH,
        HEIGHT,
        wallWidth,
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
    const { mouseConstraint } = core;
    
    const mouse = core.states.mouse;
    mouseConstraint.disabled = !isSelect && mouse.pressLocation;
    const now = new Date();
    const { Body, engine, removeFromWorld, rayQuery, rayQueryWithPoints, Vector, Composite } = core.createdEngine;
    const { getDragCellPoints, makeCell, worldOperations,
        doSelect,
        showSelect,
        doTranslate,
        doFireBall,
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
        if (key === 'c') screenOff.y+=10;
        if (key === 'v') screenOff.y -= 10;
        core.inputs.loopKey = '';
        doTranslate(screenOff);
    }
    //if (core.inputs.curBuildType === 'wall') 
    {        
        if (isSelect) {
            doSelect();
        }
        core.uiDspInfo.selectInfo = showSelect({ isSelect, key, side});
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
                const res = rayQueryWithPoints({ x: mouse.pressLocation.x, y: mouse.pressLocation.y }, { x: mouse.cur.x, y: mouse.cur.y });
                //props.inputs[`setCurCollisionStart`](`${dists} `);                    
                const endPoints = doWallSketch(core, mouse.pressLocation, mouse.cur);
                if (!endPoints.ok || !endPoints.end) return;

                const wallPts = getDragCellPoints(mouse.pressLocation, mouse.cur, endPoints);
                core.uiDspInfo.wallPts = wallPts;
                //drawCellPointsCnv(wallPts);
            }            

        } else if (mouse.state === 'released') {
            mouse.state = '';
            const mouseFrom = getMouse(mouse.pressLocation);
            const mouseCur = getMouse(mouse.cur);
            core.states.mouse.pressLocation = null;
            
            if (isCannonMode) {
                createCannon({ core, allBodies, side }, mouseCur);
            }
            if (isConnection) {
                const bodyA = core.createdEngine.getBodiesUnderPos(mouse.cur);
                if (!bodyA) return;
                const pointA = { x: mouse.cur.x - bodyA.position.x, y: mouse.cur.y - bodyA.position.y };
                const pointB = Vector.sub(mouseFrom, mouseConstraint.body.position);
                core.worldCon.addCst({ bodyB: mouseConstraint.body, bodyA, pointB, pointA});
            }
            if (isFireMode) {
                if (!mouseFrom) return;
                return doFireBall(mouseFrom, mouseCur, side);                
            }

            if (isWallMode) {
                const endPoints = doWallSketch(core, mouseFrom, mouseCur);
                if (!endPoints.ok || !endPoints.end) return;
                const wallPts = getDragCellPoints(mouseFrom, mouseCur,endPoints);                
                if (wallPts && wallPts.length) {                    
                    core.uiDspInfo.wallPts = wallPts;
                    //drawCellPointsCnv(wallPts);
                    const allWalls = makeCell(wallPts, endPoints, core.worldCats.getCat(side).structure.getCollisionFilter());
                    allWalls.forEach(w => w.health = WALLHEALTH);
                    return allWalls;
                }
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
            isImmortal: true,
        },
        opts: { restitution: 0.5, collisionFilter: worldCats.ground.structure.getCollisionFilter()},
    }, createdEngine);

    new SimpleRect({
        x: 310,
        y: 100,
        w: 30,
        h: 60,
        ggOpts: {
            isImmortal: true,
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