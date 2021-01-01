import React, {useState, useEffect } from 'react';
import './App.css';
import Scene from './Game'
import keyHandler from "./components/platform/keyHandler";
import { core } from './core';
import { initWS } from './components/thisworld/socket';
import { DesignEditor } from './components/editor/editor';

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
  const [isDesignMode, setIsDesignMode] = useState(false);
  const [curDesignInfo, setCurDesignInfo] = useState({
    isDesignMode: false,
    selectedObj: null,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    r:0, 
  });
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
  return (
    <div className="App" style={{display: 'inline-block', width:1000}}>
      <div style={{ left: 0, top: 0, float: 'left', display: 'inline-block' }}>        
        <div id='p5-parent'></div>
        <Scene inputs={{
          curKey, setCurKey, curBuildType, setCurBuildType,
          setCurCollisionStart, setCurCollisionActive, setCurCollisionEnd,
          isDesignMode: curDesignInfo.isDesignMode,
          setCurDebugText,
          setUISelectedObj: o => {
            console.log('set ui selected object');
            console.log(o);
            const info = o.cur.ggInfo.buildInfo;
            setCurDesignInfo({
              x: info.x,
              y: info.y,
              r: info.r,
              w: info.w,
              h: info.h,
            })
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
            <td>
              <DesignEditor context={{ core, curDesignInfo, selectedObj, stBuildType }}></DesignEditor>
            </td>
          </tr>
          {
            selectedObj && <tr>
              <td>x: <input type="text" value={curDesignInfo.x || '0'}></input></td>
              <td>y: <input type="text" value={curDesignInfo.y || '0'}></input></td>
              <td>r: <input type="text" value={curDesignInfo.r || '0'}></input></td>
              <td>w: <input type="text" value={curDesignInfo.w || '0'}></input></td>
              <td>h: <input type="text" value={curDesignInfo.h || '0'}></input></td>
            </tr>
          }
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
          <tr><td><input type="checkbox" checked={!!curDesignInfo.isDesignMode} onChange={() => {
            //setIsDesignMode(!isDesignMode)
            setCurDesignInfo({
              ...curDesignInfo,
              isDesignMode: !curDesignInfo.curDesignInfo,
            })
          }} ></input> Design</td></tr>
        </table>
      </div>
    </div>
  );
}

export default App;
