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
                sendWsMsg({
                    type: 'objSyncResponse',
                    bodies: core.createdEngine.engine.world.bodies.map(b => ({
                        buildInfo: b.ggInfo.buildInfo,
                        position: b.position,
                    }))
                })
                break;
            case 'objSyncResponse':
                console.log('got objSyncResponse')
                console.log(msg);
                break;
        }
    });
}