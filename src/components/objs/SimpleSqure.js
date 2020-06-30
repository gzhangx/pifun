export default function SimpleSqure(initInfo, engine) {
    const {x,y,w, opts} = initInfo;
    this.w = w;
    this.opts = opts;
    this.type = 'SimpleSqure';    
    const {addToWorld, Bodies, allBodies} = engine;
    const body = Bodies.rectangle(x, y, w, w, opts);
    addToWorld(body);

    this.body = body;
    engine.setBodyOuterParent(body, this);
    //allBodies.push(this);
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
        p.rect(0,0, w);
        p.pop();
    }
}