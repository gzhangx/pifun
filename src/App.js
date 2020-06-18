import React, {useState } from 'react';
import './App.css';
import Scene from './Game'
import keyHandler from "./components/platform/keyHandler";
import opt from './components/thisworld/world';
function App() {
  const [curKey, setCurKey] = useState();
  const [curBuildType, setCurBuildType] = useState();
  keyHandler(key=>{    
    opt.core.curKey = key;
  });
  return (
    <div className="App">
      <div>
      <Scene inputs = {{
        curKey, setCurKey, curBuildType, setCurBuildType,
        }}/>
      </div>
      <div>
        <button onClick={()=>setCurBuildType('wall')}>Wall</button>
      </div>
    </div>
  );
}

export default App;
