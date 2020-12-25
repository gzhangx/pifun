const urlBase = 'http://192.168.1.41:8081';
const WsSocket = {
    socket: null,
    freeFormMsgListener: null,
}

export function setFreeFormMsgListener(lsn) {
    WsSocket.freeFormMsgListener = lsn;
}
export function sendWsMsg(msg) {
    if (!WsSocket.socket) return;
    WsSocket.socket.emit('ggFreeFormMsg', msg);
}
export function initWS() {
    if (!WsSocket.socket) {
        const socket = require('socket.io-client')(urlBase, {
            transports: ['websocket'],
            path: '/pmapi/socket.io'
        });
        WsSocket.socket = socket;
        socket.on('connect', function () {
            console.log('connect')
        });        
        socket.on('ggFreeFormMsg', msg => {
            if (WsSocket.freeFormMsgListener) {
                WsSocket.freeFormMsgListener(msg);
            }
        })
        socket.on('disconnect', function () {
            console.log('disconnet')
        });
    }
}