import React from 'react';

export default function UIIcon({ name, className }) {
  return (
    <i
      className={`icon ${name} ${className}`}
    />
  );
}
