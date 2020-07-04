export default function SimpleCircle(initInfo, engine) {
    const {x,y,r, opts, ggOpts,} = initInfo;
    this.radius = r;
    this.opts = opts;
    this.type = initInfo.type | 'SimpleCircle';    
    const {addToWorld, Bodies} = engine;
    const body = Bodies.circle(x, y, r, opts);
    addToWorld(body);

    this.body = body;
    engine.setBodyGGInfo(body, ggOpts);
    //allBodies.push(this);
    this.show = p => {
        const pos = body.position;
        const angle = body.angle;
        p.push();
        p.translate(pos.x, pos.y);
        p.circle(0,0, r*2);
        p.pop();
    }
}