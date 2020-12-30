import React, {useState, useEffect } from 'react';
import './App.css';
import Scene from './Game'
import keyHandler from "./components/platform/keyHandler";
import { core } from './core';
import { initWS } from './components/thisworld/socket';

function App() {
  const [curKey, setCurKey] = useState();
  const [curSide, setCurSide] = useState('side1');
  const [curBuildType, setCurBuildType] = useState(core.inputs.curBuildType);
  const [curCollisionStart, setCurCollisionStart] = useState();
  const [curCollisionActive, setCurCollisionActive] = useState();
  const [curCollisionEnd, setCurCollisionEnd] = useState();
  const [curDebugText, setCurDebugText] = useState('');
  const [isMaster, setIsMaster] = useState('');
  const [gravity, setGravity] = useState('');
  const [selectedObj, setUISelectedObj1] = useState(null);
  useEffect(() => {
    initWS();
  },[]);
  keyHandler(key=>{    
    core.inputs.curKey = key;
  });
  const stBuildType = t => {
    setCurBuildType(t);
    core.inputs.curBuildType = t;
  };
  const stCurSide = e => {
    const side = parseInt(e.target.value);
    setCurSide(side);
    core.inputs.curSide = side;
  };
  //const selectedObj = core.getCurPlayerInputState().selectObj.cur;
  console.log(selectedObj);
  return (
    <div className="App" style={{display: 'inline-block', width:1000}}>
      <div style={{ left: 0, top: 0, float: 'left', display: 'inline-block' }}>        
        <div id='p5-parent'></div>
        <Scene inputs={{
          curKey, setCurKey, curBuildType, setCurBuildType,
          setCurCollisionStart, setCurCollisionActive, setCurCollisionEnd,
          setCurDebugText,
          setUISelectedObj: o => {
            console.log('set ui selected object');
            console.log(o);
            setUISelectedObj1(o);
          },
          curSide,
        }} core={core} />
      </div>
      <div style={{left: 800}}>
        <table>
          <tr>
            <td>
              <button onClick={()=>stBuildType('wall')}>Wall</button>
              <button onClick={() => stBuildType('fire')}>Fire</button>
              <button onClick={() => stBuildType('cannon')}>Cannon</button>
              <button onClick={() => stBuildType('connection')}>Connection</button>
              <button onClick={() => stBuildType('select')}>Select</button>
              <button onClick={() => stBuildType('gmakecar')}>Car</button>
            </td><td></td></tr>
          <tr>
            <td>Action</td><td>{curBuildType}</td>
          </tr>
          <tr>
            <td>Side</td><td><input type="radio" value="1" checked={curSide === 1} onChange={stCurSide}></input></td>
            <td><input type="radio" value="2" checked={curSide === 2} onChange={stCurSide}></input></td>
          </tr>
          <tr>
            <td>Col Start</td><td>{curCollisionStart}</td>
            <td>Col End</td><td>{curCollisionEnd}</td>
            <td>Col Active</td><td>{curCollisionActive}</td>            
          </tr>
          <tr>
            <td>DbgTxt</td><td colSpan='8'>{curDebugText}</td>
          </tr>
          <tr><td>setMaster<input type="checkbox" checked={isMaster} onClick={() => {
            if (!isMaster) {
              core.masterPlayerId = core.curPlayerId;
            }
            setIsMaster(!isMaster);
            
          }}></input></td>
            <td>{ core.isMaster()?'is master':'not m' }</td>
          </tr>
          <tr><td>Gravity {gravity} <button onClick={() => {
            setGravity(core.createdEngine.getGravity());
          }}>Get Gravity</button></td></tr>
        </table>
      </div>
    </div>
  );
}

export default App;
