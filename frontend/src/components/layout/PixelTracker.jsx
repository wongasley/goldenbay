// src/components/layout/PixelTracker.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PixelTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Fire a Facebook PageView event every time the URL changes
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [location.pathname]);

  return null;
};

export default PixelTracker;