import React from "react";

import opt from './components/thisworld/world';
class Scene extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    
    this.drawRef = React.createRef()
  }

  

  componentDidMount() {    
    opt.setup(this.drawRef.current, this.props);
  }

  render() {
    return <div>      
      <canvas ref={this.drawRef} ></canvas>
    </div>;
  }
}
export default Scene;