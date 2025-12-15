import { useState, useEffect } from 'react';

export const useDevice = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // Check if device supports touch AND has a small screen (typical mobile)
      const hasTouch = navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768; 
      
      // setIsMobile(true); 
      setIsMobile(hasTouch && isSmallScreen);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile };
};