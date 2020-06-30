export const WIDTH = 600;
export const HEIGHT = 600;
const WALLHEALTH = 10;
const BREAKAWAYSPEED = 10;
const BREAKAWAYANGSPEED = 0.3;
const wallWidth = 20;
const halfWallWidth = wallWidth / 10;
const PId2 = -Math.PI / 2
const dbgfmtPt = (p, fixed = 0) => p ? `(${p.x.toFixed(fixed)}/${p.y.toFixed(0)})` : 'NA';
const fmt2Int = p => parseInt(p);

export const core = {
    consts: {
        WIDTH,
        HEIGHT,
        wallWidth,
        halfWallWidth,
        PId2,
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
            pressLocation: {
                x: 0,
                y: 0,
            },
            cur: {
                x: 0,
                y: 0,
            }
        }
    },
    inputs: {
        curKey: '',
        curBuildType: '',
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
    },

    deepCurCollisions: {},
};