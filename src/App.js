import React, {useState } from 'react';
import './App.css';
import Scene from './Game'
import keyHandler from "./components/platform/keyHandler";
import opt from './components/thisworld/world';
function App() {
  const [curKey, setCurKey] = useState();
  keyHandler(key=>{    
    opt.core.curKey = key;
  });
  return (
    <div className="App">
      <Scene inputs = {{curKey, setCurKey}}/>
    </div>
  );
}

export default App;
