export default function SimpleCircle(initInfo, engine) {
    const {x,y,r, opts, ggOpts,} = initInfo;
    this.radius = r;
    this.opts = opts;
    this.type = initInfo.type | 'SimpleCircle';    
    const {addToWorld, Bodies} = engine;
    const body = Bodies.circle(x, y, r, opts);
    addToWorld(body);

    this.body = body;
    ggOpts.buildInfo = {
        type: 'circle',
        x, y, r,
    };
    ggOpts.funcs = {};
    engine.setBodyGGInfo(body, ggOpts);
}