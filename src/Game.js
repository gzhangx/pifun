import React from "react";

import { core } from './core';
import opt from './components/thisworld/world';
class Scene extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    
    this.drawRef = React.createRef()
  }

  

  componentDidMount() {    
    opt.setup(this.drawRef.current, this.props, core);
  }

  render() {
    return <div>      
      <canvas ref={this.drawRef} onDragStart={e => e.preventDefault()}></canvas>
    </div>;
  }
}
export default Scene;