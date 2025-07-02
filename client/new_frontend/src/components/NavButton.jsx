import React, { useState } from 'react';

const NavButton = ({ onClick, children, title, isActive = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  const navButtonStyle = {
    flex: '1',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '40px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'all 0.2s ease',
    margin: '0 4px',
  };

  return (
    <button
      style={{
        ...navButtonStyle,
        backgroundColor: isActive
          ? '#fce4ec'
          : isHovered
            ? '#f8bbd9'
            : 'transparent',
        color: isActive ? '#e91e63' : '#424242',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
};

export default NavButton;
