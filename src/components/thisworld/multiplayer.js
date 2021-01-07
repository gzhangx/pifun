import { sendWsMsg, setFreeFormMsgListener } from './socket';

export function setupMultiplayer(core) {
    setFreeFormMsgListener(msg => {
        if (msg.player === core.playersInfo.curPlayerId) return;
        switch (msg.type) {
            case 'setMasterPlayer':
                const { masterPlayerId } = msg;
                core.playersInfo.masterPlayerId = masterPlayerId;
                console.log(`master player is ${masterPlayerId}`);
                break;
            case 'mouseMsg':
                const { player, mouse } = msg;
                const playerState = core.getCurPlayerInputState(player);
                if (!playerState.mouse) playerState.mouse = mouse;
                else playerState.mouse = Object.assign(playerState.mouse, mouse);
                break;
            case 'objSyncMsg':
                if (!core.playersInfo.isMaster()) return;
                const getBodyIdOnly = b => b && { id: b.id };
                const items = core.createdEngine.engine.world.bodies.reduce((acc, b) => {
                    if (!acc.keys[b.id]) {
                        acc.keys[b.id] = b;
                        acc.bodies.push({
                            buildInfo: b.ggInfo.buildInfo,
                            position: b.position,
                            angle: b.angle,
                        });
                        if (b.ggConstraints) {
                            b.ggConstraints.forEach(cst => {
                                if (!acc.keys[cst.id]) {
                                    acc.keys[cst.id] = cst;
                                    acc.constraints.push({
                                        opts: {id: cst.id},
                                        pointA: cst.pointA,
                                        pointB: cst.pointB,
                                        bodyA: getBodyIdOnly(cst.bodyA),
                                        bodyB: getBodyIdOnly(cst.bodyB),
                                    })
                               } 
                            });
                        }
                    }
                    return acc;
                }, {
                    bodies: [],
                    constraints: [],
                    keys: {}
                });
                sendWsMsg({
                    type: 'objSyncResponse',
                    bodies: items.bodies,
                    constraints: items.constraints,
                })
                break;
            case 'objSyncResponse':
                console.log('got objSyncResponse')
                console.log(msg);
                core.createdEngine.clearAll();
                core.importBuildInfo(msg); //bodies, constraints
                break;
        }
    });
}