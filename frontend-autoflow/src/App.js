// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import styled from 'styled-components';
import { GlobalStyle } from './GlobalStyle';
import Menu from './components/Menu';
import Login from './components/Login';

const AppContainer = styled.div`
  font-family: 'Arial', sans-serif;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const App = () => {
  return (
    <Router>
      <GlobalStyle />
      <AppContainer>
        <Menu />
        <Routes>
          <Route path="/" element={<Login />} />
        </Routes>
      </AppContainer>
    </Router>
  );
};

export default App;

