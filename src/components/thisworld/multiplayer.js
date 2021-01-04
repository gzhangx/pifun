import { sendWsMsg, setFreeFormMsgListener } from './socket';

export function setupMultiplayer(core) {
    setFreeFormMsgListener(msg => {
        if (msg.player === core.curPlayerId) return;
        switch (msg.type) {
            case 'mouseMsg':
                const { player, mouse } = msg;
                const playerState = core.getCurPlayerInputState(player);
                if (!playerState.mouse) playerState.mouse = mouse;
                else playerState.mouse = Object.assign(playerState.mouse, mouse);
                break;
            case 'objSyncMsg':
                sendWsMsg({
                    type: 'objSyncResponse',
                    bodies: core.createdEngine.engine.world.bodies.map(b => ({
                        buildInfo: b.ggInfo.buildInfo,
                        position: b.position,
                    }))
                })
                break;
        }
    });
}