// src/GlobalStyle.js
import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Arial', sans-serif;
    background-color: #f3f4f6; /* Pastel background */
    color: #333;
  }

  a {
    text-decoration: none;
    color: inherit;
  }
`;
