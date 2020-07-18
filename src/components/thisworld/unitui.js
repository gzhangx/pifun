import { getDispAng } from '../platform/engine';
const drawCellPointsCnv = (p, dspInfo) => {
    const connects = dspInfo.wallPts;
    dspInfo.wallPts = [];
    connects.reduce((acc, c) => {
        const showRect = (rr, stroke = '#ff0000', fill = '#0000ff') => {
            p.save();
            p.translate(rr.x, rr.y);
            p.rotate(getDispAng(rr.angle || 0));
            //p.stroke(stroke);
            //p.strokeWeight(2);
            //p.fill(fill);
            p.fillStyle = fill;
            p.fillRect(-(rr.w / 2), -(rr.h / 2), rr.w, rr.h);
            p.restore();
        };

        const chkshow = a => {
            if (acc[a.id]) return;
            acc[a.id] = a;
            showRect(a);
        }
        const { a, b } = c;
        chkshow(a);
        chkshow(b);

        const { pointA, pointB } = c;
        p.save();
        //p.stroke('#00ff00');
        //p.strokeWeight(2);
        const xa = pointA.x + a.x;
        const ya = pointA.y + a.y;
        const xb = pointB.x + b.x;
        const yb = pointB.y + b.y;
        //p.line(xa, ya, xb, yb);
        showRect(Object.assign({}, a, { w: 20, h: 20 }), '#223344', '#0000ff');
        //showRect({ x: a.x + pointA.x, y: a.y + pointA.y, w: 10, h: 10 }, '#223344', '#00ff00');
        //showRect({ x: b.x + pointB.x + 10, y: b.y + pointB.y, w: 10, h: 10 }, '#223344', '#ff0000');
        //setCurDebugText(`debugremove ===> ${dbgfmtPt(mouse.cur)} ax=${dbgfmtPt(a)} da=${dbgfmtPt(pointA)} bx is ${dbgfmtPt(b)} db=da=${dbgfmtPt(pointB)}`);
        //p.line(xa, ya, xb, yb);

        p.restore();
        return acc;
    }, {});
}

export function postRender(c, opts) {
    const dspInfo = opts.core.uiDspInfo;
    drawCellPointsCnv(c, dspInfo);
}