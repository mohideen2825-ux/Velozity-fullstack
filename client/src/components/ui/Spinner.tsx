import React from 'react';

const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => (
  <div className={`spinner spinner-${size}`} role="status" aria-label="Loading" />
);

export default Spinner;
