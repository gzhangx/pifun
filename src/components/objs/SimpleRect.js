export default function CreateSimpleRect(initInfo, engine) {
    const { x, y, w, h, opts, ggOpts = {}} = initInfo;    
    //this.type = this.opts.label || 'SimpleRect';    
    const {addToWorld, Bodies, } = engine;
    const body = Bodies.rectangle(x, y, w, h, opts);
    //body.label = this.type;
    addToWorld(body);

    const ggInfo = ggOpts || { health: 0, h };
    ggInfo.buildInfo = {
        id: body.id,
        type: 'rectangle',
        x, y, w, h,
        opts,
    };
    ggOpts.funcs = {};
    engine.setBodyGGInfo(body, ggInfo);
    return body;
}