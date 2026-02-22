import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SEO = ({ 
  title, 
  description = "Experience luxury Chinese dining and live seafood at Golden Bay Restaurant in Pasay City.", 
  name = "Golden Bay Restaurant", 
  type = "website",
  image = "https://goldenbay.com.ph/assets/images/golden_bay_cover.webp" // Default fallback image
}) => {
  const location = useLocation();
  const currentUrl = `https://goldenbay.com.ph${location.pathname}`;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{title ? `${title} | ${name}` : name}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={title ? `${title} | ${name}` : name} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title ? `${title} | ${name}` : name} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;