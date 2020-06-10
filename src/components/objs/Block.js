export default function Block(initInfo, enging) {
    const {x,y,w,h} = initInfo;
    this.w = w;
    this.h = h;
    this.opts = opts;    
    const {World, world, Bodies, p} = engine;
    const body = Bodies.rectangle(x,y,w,h);    
    World.add(world, this.body);

    this.show = function() {
        const pos = body.position;
        const angle = body.angle;
        p.push();
        p.translate(pos.x, pos.y);
        p.rect(0,0, w,h);
        p.pop();
    }
}