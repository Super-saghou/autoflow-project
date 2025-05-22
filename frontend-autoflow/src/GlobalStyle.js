import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
  }

  body {
    background-color: #f9fafb;
    color: #333;
    font-smooth: always;
    -webkit-font-smoothing: antialiased;
  }

  input, button {
    outline: none;
  }

  a {
    text-decoration: none;
    color: inherit;
  }
`;

export default GlobalStyle;

