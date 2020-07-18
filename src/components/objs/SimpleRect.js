export default function SimpleRect(initInfo, engine) {
    const {x,y,w,h, opts, ggOpts} = initInfo;
    this.w = w;
    this.h = h;
    this.opts = opts || {};
    this.type = this.opts.label || 'SimpleRect';    
    const {addToWorld, Bodies, } = engine;
    const body = Bodies.rectangle(x, y, w, h, opts);
    body.label = this.type;
    addToWorld(body);

    this.body = body;
    engine.setBodyGGInfo(body, ggOpts || {health: 0, h});    
}