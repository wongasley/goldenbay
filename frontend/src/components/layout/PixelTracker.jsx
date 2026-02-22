import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PixelTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if fbq exists (it should, from index.html)
    if (window.fbq) {
      // Fire a PageView event every time the route changes
      window.fbq('track', 'PageView');
    }
  }, [location]);

  return null; // This component doesn't render anything
};

export default PixelTracker;