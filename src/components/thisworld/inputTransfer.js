import { sendWsMsg } from './socket';

const importFields = [
    'curBuildType',
    'curKey',
    {
        obj: 'mouse',
        pathes: [
            'state',            
            {
                obj: 'pressLocation',
                pathes: ['x','y']
            }, {
                obj: 'cur',
                pathes: ['x', 'y']
            }                        
        ]
    }
];

function loop(act) {
    return importFields.reduce((acc, field) => {
        if (typeof field === 'string') {
            act(acc,)
        }
        act(acc, field);
        return acc;
    }, {})
}


function recSet(rootObj, cur, prev, field, msg) {
    let changed = false;
    if (typeof field === 'string') {
        if (!cur) return;
        const n = cur[field];
        if (n !== prev[field]) {
            prev[field] = n;
            changed = true;
            msg[field] = n;
        }
    } else {
        const curObj = cur && cur[field.obj];
        const curPrev = (prev && prev[field.obj]) || {};
        const msgPrt = {};
        field.pathes.forEach(p => {
            changed |= recSet(rootObj, curObj, curPrev, p, msgPrt);
        });
        if (changed) {
            msg[field.obj] = msgPrt;
        }
        prev[field.obj] = curPrev;
    }
    if (changed) {
        rootObj.changed = true;
    }
    return changed;
}

function gatherPlayerInputs(curPlayerInputState,
    prev) {
    const msg = {
        selectObj: {},
    };
    return importFields.reduce((acc, field) => {
        recSet(acc, curPlayerInputState, prev, field, acc.msg);
        return acc;
    }, {
        msg: {},
        changed: false,
    });
}

export function sendWsPlayerInputs(core) {
    const curPlayerInputState = core.getCurPlayerInputState();
    const prev = core.inputs;
    const info = gatherPlayerInputs(curPlayerInputState,
        prev)
    if (info.changed) {
        //userInputMsg
        //sendWsMsg(info.msg);
        sendWsMsg({
            type: 'userInputMsg',
            player: core.curPlayerId,
            mouse: curPlayerInputState.mouse,
        })
    }
}