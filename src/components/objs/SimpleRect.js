export default function SimpleRect(initInfo, engine) {
    const {x,y,w,h, opts} = initInfo;
    this.w = w;
    this.h = h;
    this.opts = opts || {};
    this.type = this.opts.label || 'SimpleRect';    
    const {addToWorld, Bodies, allBodies} = engine;
    const body = Bodies.rectangle(x, y, w, h, opts);
    body.label = this.type;
    addToWorld(body);

    this.body = body;
    engine.setBodyOuterParent(body, this);
    allBodies.push(this);
    this.show = p => {
        const pos = body.position;
        const angle = body.angle;
        p.push();        
        p.translate(pos.x, pos.y);        
        p.rotate(angle);
        p.rectMode(p.CENTER);
        p.stroke(255);
        p.strokeWeight(4);
        p.fill(127);
        p.rect(0, 0, w, h);
        if (body.ggParent) {
            if (body.ggParent.health) {
                p.text(body.ggParent.health.toFixed(0), 0, 0);
            }
        }
        p.pop();
    }
}