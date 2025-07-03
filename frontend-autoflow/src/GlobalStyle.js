import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Inter', 'Poppins', 'Roboto', Arial, sans-serif;
    transition: background 0.2s, color 0.2s;
  }

  body {
    background: linear-gradient(120deg, #f9fafb 0%, #FFF9E5 100%);
    color: #1A2A44;
    font-smooth: always;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
  }

  input, button {
    outline: none;
    font-family: inherit;
  }

  a {
    text-decoration: none;
    color: inherit;
  }
`;

export default GlobalStyle;

