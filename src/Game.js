import React from "react";
import {createEngine, setup} from "./components/platform/engine";


import opt from './components/thisworld/world';
const WIDTH = 600;
const HEIGHT = 600;
class Scene extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    
    this.drawRef = React.createRef()
  }

  

  componentDidMount() {          
    const engine= createEngine();  
    
    this.myP5 = setup(this.drawRef.current, opt, engine);
  }

  render() {
    return <div ref="scene" >
      
    </div>;
  }
}
export default Scene;