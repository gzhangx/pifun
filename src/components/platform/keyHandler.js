import { useState, useEffect } from 'react';
const KeyHandler = cb => {
    const [keyPressed, setKeyPressed] = useState();
    useEffect(() => {
      const onKeyDown = (e) => {
        const key = e.key;        
          e.preventDefault();
          setKeyPressed(key);        
          if (cb) cb(key);
      };
      window.addEventListener('keydown', onKeyDown);
  
      return () => {
        window.removeEventListener('keydown', onKeyDown);
      };
    });
    return keyPressed;
  };
  
  export default KeyHandler;