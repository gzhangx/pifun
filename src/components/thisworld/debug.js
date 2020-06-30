export const debugShowConstraints = (engine, p, Composite) => {
    const addPt = (a, who) => {
        const ba = `body${who}`;
        const pa = `point${who}`;
        const aba = a[ba];
        if (!aba) return;
        const bapos = aba.position; //a.bodyA.position
        const ppos = a[pa]; //a.point
        return {
            x: bapos.x + ppos.x,
            y: bapos.y + ppos.y,
        }
    }
    //core.constraints
    Composite.allConstraints(engine.world).forEach(cst => {
        const p1 = addPt(cst, 'A');
        const p2 = addPt(cst, 'B');
        if (!p1) return;
        if (!p2) return;
        p.push();
        p.stroke(0);
        p.line(p1.x, p1.y, p2.x, p2.y);
        p.pop();
    });
}

const debugDeepCollisions = [];
export const debugShowCollisions = (core, p) => {
    const pairs = core.collisions;
    //console.log(e.pairs);
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];

        if (!pair.isActive)
            continue;

        p.push();
        for (let j = 0; j < pair.activeContacts.length; j++) {
            const contact = pair.activeContacts[j],
                vertex = contact.vertex;
            p.stroke(128);
            p.strokeWeight(2);
            p.rect(vertex.x - 1.5, vertex.y - 1.5, 3.5, 3.5);
        }
        p.pop();

        // render collision normals                    
        const collision = pair.collision;

        if (pair.activeContacts.length > 0) {
            var normalPosX = pair.activeContacts[0].vertex.x,
                normalPosY = pair.activeContacts[0].vertex.y;

            if (pair.activeContacts.length === 2) {
                normalPosX = (pair.activeContacts[0].vertex.x + pair.activeContacts[1].vertex.x) / 2;
                normalPosY = (pair.activeContacts[0].vertex.y + pair.activeContacts[1].vertex.y) / 2;
            }

            let fx, fy;
            if (collision.bodyB === collision.supports[0].body || collision.bodyA.isStatic === true) {
                fx = normalPosX - collision.normal.x * 8;
                fy = normalPosY - collision.normal.y * 8;
            } else {
                fx = normalPosX + collision.normal.x * 8;
                fy = normalPosY + collision.normal.y * 8;
            }

            p.line(fx, fy, normalPosX, normalPosY);

            if (collision.depth) {
                if (collision.bodyA.label === 'fireball' || collision.bodyB.label === 'fireball') {
                    debugDeepCollisions.push({
                        time: new Date(),
                        depth: collision.depth,
                        x: fx,
                        y: fy,
                    });
                }
            }
        }
    }

    p.push();
    debugDeepCollisions.forEach(r => {
        p.translate(r.x, r.y);
        p.text(r.depth.toFixed(2), 0, 0);
        p.rectMode(p.CENTER);
        p.stroke('ff0000');
        p.strokeWeight(2);
        p.fill('0000ff');
        p.rect(-2, -2, 4, 4);
    })
    p.pop();
    const now = new Date();
    for (let i = debugDeepCollisions.length - 1; i >= 0; i--) {
        const c = debugDeepCollisions[i];
        if (now - c.time > 1000) {
            debugDeepCollisions.splice(i, 1);
        }
    }
}