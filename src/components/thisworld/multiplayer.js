import { sendWsMsg, setFreeFormMsgListener } from './socket';

export function setupMultiplayer(core) {
    setFreeFormMsgListener(msg => {
        switch (msg.type) {
            case 'mouseMsg':
                const { player, mouse } = msg;
                const playerState = core.getCurPlayerInputState(player);
                if (!playerState.mouse) playerState.mouse = mouse;
                else playerState.mouse = Object.assign(playerState.mouse, mouse);
                break;
        }
    });
}