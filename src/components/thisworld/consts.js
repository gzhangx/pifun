export const WIDTH = 800;
export const HEIGHT = 600;
const WALLHEALTH = 10;
const BREAKAWAYSPEED = 10;
const BREAKAWAYANGSPEED = 0.3;
const wallWidth = 20;
const halfWallWidth = wallWidth / 10;

export function createCore() {
    const core = {
        consts: {
            WIDTH,
            HEIGHT,
            wallWidth,
            halfWallWidth,
            WALLHEALTH,
            BREAKAWAYSPEED,
            BREAKAWAYANGSPEED,
        },
        createdEngine: null,
        //allBodies,
        //constraints: [],
        collisions: [],
        collisionEvent: {},
        states: {
            mouse: {
                state: '',
                pressLocation: null,
                cur: null,
            }
        },
        inputs: {
            curKey: '',
            curSide: 'side1',
            curBuildType: 'wall',
        },
        //https://github.com/liabru/matter-js/blob/5f5b8a1f279736b121231a41181621b86253ea1c/src/body/Body.js#L1040
        worldCats: {
            ground: {
                structure: {
                    category: 0,
                    mask: 0,
                    getCollisionFilter: null,
                },
            },
            c1: {
                structure: {
                    category: 0,
                    mask: 0,
                    getCollisionFilter: null,
                },
                fire: {
                    category: 0,
                    mask: 0,
                    getCollisionFilter: null,
                },
            },
            c2: {
                structure: {
                    category: 0,
                    mask: 0,
                    getCollisionFilter: null,
                },
                fire: {
                    category: 0,
                    mask: 0,
                    getCollisionFilter: null,
                },
            },
            getCat: side => {
                if (side === 'side1') {
                    return core.worldCats.c1;
                }
                return core.worldCats.c2;
            },
        },

        deepCurCollisions: {},
        mouseConstraint: null,
        selectObj: {
            cur: null,
            curIndex: -1,
            curType: '',
        },

        uiDspInfo: {
            wallPts: [],
        }
    };

    core.selectObj.reset = () => {
        core.selectObj.cur = null;
        core.selectObj.curBase = null;
        core.selectObj.curIndex = -1;
        core.selectObj.curType = '';
    };

    return core;
}