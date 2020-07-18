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



export function showCannonHolder(c, dspInfo) {
    if (!dspInfo.cannonHolder) return;
    const { x, y, w, h, cannonInfo: rrr } = dspInfo.cannonHolder;
    if (!rrr) return;
    dspInfo.cannonHolder = null;
    const { p1, p2 } = rrr.queryInfo.edge;
    const { newC, fromEnd1, fromEnd2, goodPts } = rrr;
    const projPt = rrr.projPt; //getProjectionPoint(p1, p2, { x, y });
    if (projPt) {
        if (projPt.inRange) {            
            c.save();
            c.strokeStyle = '#0000ff';
            c.strokeWeight = 8;
            c.beginPath();
            c.moveTo(x, y);
            c.lineTo(p1.x, p1.y);
            c.moveTo(x, y);
            c.lineTo(p2.x, p2.y);
            c.stroke();
            c.strokeStyle = '#0000ff';
            c.strokeWeight = 4;
            //c.fill(127);
            c.beginPath();
            c.moveTo(x, y);
            c.lineTo(projPt.x, projPt.y);
            c.stroke();
            c.restore();

            const angle = newC.angle;
            c.beginPath();
            c.strokeStyle = '#bbb';
            c.strokeWeight = 4;
            c.beginPath();
            c.arc(fromEnd1.x, fromEnd1.y, 10, 0, 2 * Math.PI);
            c.stroke();
            c.strokeStyle = '#222';
            c.beginPath();
            c.arc(fromEnd2.x, fromEnd2.y, 10, 0, 2 * Math.PI);
            c.stroke();
            c.save();
            c.translate(newC.x, newC.y);
            c.rotate(angle || 0);
            c.strokeStyle = '#bbb';
            c.strokeWeight = 4;
            //c.fill(127);
            c.beginPath();
            c.strokeStyle = '#222222';
            c.fillStyle = '#222222';
            c.fillText(((angle / Math.PI) * 180).toFixed(0), 0, 0);
            c.rect(-w / 2, -h / 2, w, h);
            c.stroke();

            c.restore();
            c.save();
            c.beginPath();
            c.strokeStyle = '#bbb';
            c.strokeWeight = 4;
            //c.translate(fromEnd1.x, fromEnd1.y);
            c.beginPath();
            c.rect(fromEnd1.x - 5, fromEnd1.y - 5, 10, 10);
            c.stroke();
            c.beginPath();
            c.rect(fromEnd2.x - 5, fromEnd2.y - 5, 10, 10);
            c.stroke();
            const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffaaff']
            goodPts.map((pt, i) => {
                const size = 20 - i * 3;
                c.beginPath();
                c.strokeStyle = colors[i];
                c.rect(pt.x - (size / 2), pt.y - (size / 2), size, size);
                c.stroke();
            })
            c.restore();
        }
    }

}



function showSelect(c, dspInfo) {
    const selectInfo = dspInfo.selectInfo;
    if (!selectInfo) return;        
    dspInfo.selectInfo = null;
    c.beginPath();
    c.strokeStyle = '#00ff00';
    c.strokeWeight = 10;
    c.fillStyle = '#00ff00';
    const bodyPos = selectInfo.bodyPos;
    if (bodyPos) {
        c.fillRect(bodyPos.x - 5, bodyPos.y - 5, 10, 10);
    } else if (selectInfo.constraint){
        const { start, end } = selectInfo.constraint;

        c.moveTo(start.x, start.y);
        c.lineTo(end.x + 5, end.y + 5);
        c.lineWidth = 10;
    }
    c.stroke();

    if (selectInfo.cannonCone) {
        const {
            bpx,
            bpy,
            to1,
            len,
            degl2, degl1,
        } = selectInfo.cannonCone;
        {            
            const dovn = (deg, len) => {
                const x = Math.cos(deg) * len;
                const y = Math.sin(deg) * len;
                c.beginPath();
                c.moveTo(bpx, bpy);
                const to = {
                    x: x + bpx,
                    y: y + bpy,
                }
                c.lineTo(to.x, to.y);
                c.lineWidth = 3;
                c.strokeStyle = "rgba(200, 0, 128, 0.2)";;
                c.stroke();
                return to;
            }
            
            //setCurDebugText(`dirxy=${dirx.toFixed(0)} ${diry.toFixed(0)}`);
            if (selectInfo.cannonDir) {                
                
                const {                    
                    to,
                } = selectInfo.cannonDir;
                c.beginPath();
                c.lineWidth = 3;
                c.strokeStyle = "000";
                c.moveTo(bpx, bpy);
                c.lineTo(to.x, to.y);
                c.stroke();
            }
            c.beginPath();
            c.fillStyle = "rgba(255, 0, 128, 0.2)";
            c.moveTo(bpx, bpy);
            c.lineTo(to1.x, to1.y);
            c.arc(bpx, bpy, len, degl2, degl1)
            c.lineTo(bpx, bpy);
            c.fill();
            c.stroke();            
        }
    }
}

function showFireLine(c, dspInfo) {
    if (dspInfo.fireDirInfo) {
        const { from, to } = dspInfo.fireDirInfo;
        dspInfo.fireDirInfo = null;        
        c.beginPath();
        c.lineWidth = 5;
        c.strokeStyle = 'red';
        c.moveTo(from.x, from.y);
        c.lineTo(to.x, to.y);
        c.stroke();
    }
}

export function postRender(c, opts) {
    const dspInfo = opts.core.uiDspInfo;
    showFireLine(c, dspInfo);
    drawCellPointsCnv(c, dspInfo);
    showCannonHolder(c, dspInfo);
    showSelect(c, dspInfo);    
}