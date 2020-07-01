import React from "react";
import {createEngine, setup} from "./components/platform/engine";


import opt from './components/thisworld/world';
class Scene extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    
    this.drawRef = React.createRef()
  }

  

  componentDidMount() {    
    this.myP5 = setup(this.drawRef.current, opt, this.props);
  }

  render() {
    return <div>      
      <canvas ref={this.drawRef} ></canvas>
    </div>;
  }
}
export default Scene;