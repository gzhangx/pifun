import { utils } from './util';
export const WIDTH = 1800;
export const HEIGHT = 600;
const WALLHEALTH = 10;
const BREAKAWAYSPEED = 10;
const BREAKAWAYANGSPEED = 0.3;
const wallWidth = 20;
const halfWallWidth = wallWidth / 10;
export const INVALID_NUM = -9999999;
export function createCore() {
    const curPlayerId = utils.uuidv1();
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
        designerData: {
            items: [],
            constraints: [],
        },
        //allBodies,
        //constraints: [],
        collisions: [],
        collisionEvent: {},
        states: {
            mouse: {
                state: '',
                pressLocation: null,
                cur: null,
            },
            lastGoodWallPts: null,
        },
        inputs: {
            curKey: '',
            curSide: 1,
            curBuildType: 'wall',
            isDesignMode: false,
        },
        playersInfo: {
            curPlayerId,
            masterPlayerId: '',
            isMaster: ()=>core.playersInfo.masterPlayerId === curPlayerId,
            playerIds: [curPlayerId],
            players: {
                [curPlayerId]: {
                    playerInputState: {
                        mouse: {
                            state: '',
                            pressLocation: null,
                            cur: null,
                        },
                        lastGoodWallPts: null,
                        curKey: '',
                        curSide: 1,
                        curBuildType: 'wall',
                        selectObj: {
                            cur: null,
                            curIndex: -1,
                            curType: '',
                            curProcessed: false,
                            prevPos: { x: INVALID_NUM, y: INVALID_NUM}
                        },
                        events: {
                            onSelectedObjectChange: null,
                        }
                    }
                }
            }
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
            cannonHolder: null,
            selectInfo: null,
        }
    };


    const addResetToSelectObj = selectObj => {
        selectObj.reset = () => {
            selectObj.cur = null;
            selectObj.curBase = null;
            selectObj.curIndex = -1;
            selectObj.curType = '';
        }
    }
    addResetToSelectObj(core.selectObj);

    core.getPlayerById = id => {
        return core.playersInfo.players[id];  
    }
    core.getPlayerInputStateById = id => {
        let player = core.getPlayerById(id);
        if (!player) {            
            player = {
                playerInputState: {
                    mouse: {
                        state: '',
                        pressLocation: null,
                        cur: null,
                    },
                    lastGoodWallPts: null,
                    curKey: '',
                    curSide: 1,
                    curBuildType: 'wall',
                    selectObj: {
                        cur: null,
                        curIndex: -1,
                        curType: '',
                    },
                }
            };
            core.playersInfo.players[id] = player;
            core.playersInfo.players = core.playersInfo.players.push(id);
        }
        return player.playerInputState;
    }
    core.getCurPlayer = () => {
        return core.getPlayerById(curPlayerId);
    };
    core.getCurPlayerInputState = () => {
        return core.getPlayerInputStateById(curPlayerId);
    }

    core.isMaster = () => {
        return core.masterPlayerId === core.curPlayerId;
    }
    addResetToSelectObj(core.getCurPlayerInputState().selectObj);

    const { selectObj, events } = core.getCurPlayerInputState();
    core.raiseMySelectedObjChange = ()=> {
        events.onSelectedObjectChanged(selectObj);
    }
    return core;
}