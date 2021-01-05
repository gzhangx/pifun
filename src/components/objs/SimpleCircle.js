export default function CreateSimpleCircle(initInfo, engine) {
    const { x, y, r, opts, ggOpts = {},} = initInfo;
    //this.radius = r;
    //this.opts = opts;
    //this.type = initInfo.type | 'SimpleCircle';    
    const {addToWorld, Bodies} = engine;
    const body = Bodies.circle(x, y, r, opts);
    addToWorld(body);

    //this.body = body;
    ggOpts.buildInfo = {
        id: body.id,
        type: 'circle',
        x, y, r,
        opts,
        //ggOpts: {...ggOpts},
    };
    ggOpts.funcs = {};
    engine.setBodyGGInfo(body, ggOpts);
    return body;
}