import React, { useState, useEffect } from 'react';
import { get } from 'lodash';

export function getEditorInitState() {
    return {
        isDesignMode: false,
        selectedObj: null,
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        r: 0,
        centerX: 0,
        centerY: 0,
    };
}

export function setUISelectedObj(setCurDesignInfo, o) {
    console.log('set ui selected object');
    console.log(o);
    const info = get(o, 'cur.ggInfo.buildInfo');
    if (!info) return;
    setCurDesignInfo(prev => ({
        ...prev,
        selectedObj: o,
        x: info.x || 0,
        y: info.y || 0,
        r: info.r || 0,
        w: info.w || 0,
        h: info.h || 0,
    }))
}

export function DesignEditor(props) {
    const { core, curDesignInfo, setCurDesignInfo,
        stBuildType } = props.context;        
    const { selectedObj } = curDesignInfo;
    const tranx = curDesignInfo.x - curDesignInfo.centerX;
    const trany = curDesignInfo.y - curDesignInfo.centerY;
    //const selectedObj = core.getCurPlayerInputState().selectObj.cur;
    const setInfo = o => {
        setCurDesignInfo(prev => Object.assign({}, prev, o));
    }
    const def0 = o => {
        o = parseFloat(o || '0');
        if (isNaN(o)) return 0;
        return o;
    }
    const defUi0 = e => def0(e.target.value);    
    const defUi0ByName = (name) => e=> setInfo({ [name]: defUi0(e) });
    return (        
            <div>
                <table>
                    <tr>
                        <td>
                            <button onClick={() => stBuildType('circle')}>Circle</button>
                            <button onClick={() => stBuildType('rectangle')}>Rect</button>
                        </td>
                        <td>
                            <input ></input>
                        </td>
                    </tr>
                {
                    selectedObj && <><tr>
                        <td>x: <input type="text" value={tranx} onChange={
                            defUi0ByName('x')
                        }></input></td>
                        <td>y: <input type="text" value={trany} onChange={
                            defUi0ByName('y')
                        }></input></td>
                        <td>r: <input type="text" value={curDesignInfo.r} onChange={defUi0ByName('r')}></input></td>
                        <td>w: <input type="text" value={curDesignInfo.w} onChange={defUi0ByName('w')}></input></td>
                        <td>h: <input type="text" value={curDesignInfo.h} onChange={defUi0ByName('h')}></input></td>
                    </tr>
                        <tr>
                            <td><button onClick={() => {
                                console.log('center click')
                                console.log(selectedObj);
                                const buildInfo = selectedObj.cur.ggInfo.buildInfo;
                                const { x:centerX , y:centerY} = buildInfo;
                                setCurDesignInfo(prev => ({
                                    ...prev,
                                    centerX,
                                    centerY,
                                }))
                            }}>SetCenter</button> </td>
                        </tr>
                        </>
                }
                <tr><td><input type="checkbox" checked={!!curDesignInfo.isDesignMode} onChange={() => {
                    //setIsDesignMode(!isDesignMode)
                    core.inputs.isDesignMode = !curDesignInfo.isDesignMode;
                    //console.log('set design mode to ' + core.inputs.isDesignMode)
                    setCurDesignInfo(prev=>({
                        ...prev,
                        isDesignMode: !prev.isDesignMode,
                    }))
                }} ></input> Design</td></tr>
                </table>
            </div>        
    );
}

