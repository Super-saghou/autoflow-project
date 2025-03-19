// src/components/Menu.js
import React from 'react';
import styled from 'styled-components';

const MenuContainer = styled.div`
  background-color: #C25A3D; 
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MenuItem = styled.a`
  color: #fff;
  font-size: 18px;
  margin: 0 15px;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const Menu = () => {
  return (
    <MenuContainer>
      <MenuItem href="/">Home</MenuItem>
      <MenuItem href="/about">About</MenuItem>
      <MenuItem href="/contact">Contact</MenuItem>
    </MenuContainer>
  );
};

export default Menu;

