import React from "react";
import p5 from "p5";
import {createEngine} from "./components/world/engine";

const WIDTH = 600;
const HEIGHT = 600;
class Scene extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.drawRef = React.createRef()
  }

  

  componentDidMount() {    
      
    const {addToWorld, Bodies} = createEngine();
    const allBodies = [];

    var ballA = Bodies.circle(210, 100, 30, { restitution: 0.5 });
    var ballB = Bodies.circle(110, 50, 30, { restitution: 0.5 });
    allBodies.push(ballA);
    allBodies.push(ballB);
    console.log(Bodies.rectangle(200, 0, 600, 50, { isStatic: true }));
    addToWorld([
      // walls      
      Bodies.rectangle(WIDTH/2, HEIGHT, WIDTH, 60, { isStatic: true })
    ])
    

    addToWorld([ballA, ballB]);
    
    

    //Render.run((render));
    const Sketch = p => {
      p.setup = () => {
        p.createCanvas(WIDTH, HEIGHT)
      }
  
      p.draw = () => {
        p.background(0);
        p.fill(255);
        allBodies.forEach(bdy=>{
          p.rect(bdy.position.x - 30, bdy.position.y - 30, 60,60);
        });
        
      }

      p.mousePressed = ()=>{
        console.log(p.mouseX)
        const bdy = Bodies.circle(p.mouseX, p.mouseY, 30, { restitution: 0.7 });
        allBodies.push(bdy);
        console.log('x' +p.mouseX+' ' + p.mouseY)
        addToWorld(bdy);
        //World.add(engine.world, Bodies.circle(150, p.mouseX, p.mouseY, { restitution: 0.7 }));
      }
   }
    this.myP5 = new p5(Sketch, this.drawRef.current);
  }

  render() {
    return <div ref="scene" >
      
    </div>;
  }
}
export default Scene;