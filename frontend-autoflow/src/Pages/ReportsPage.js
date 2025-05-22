import React from 'react';
import styled from 'styled-components';

const ReportsPageContainer = styled.div`
  padding: 20px;
  background-color: #fff;
  height: 100vh;
`;

const ReportsPageTitle = styled.h1`
  font-size: 2.5rem;
  color: #333;
`;

const ReportsPage = () => {
  return (
    <ReportsPageContainer>
      <ReportsPageTitle>Reports</ReportsPageTitle>
      <p>This is where you can view reports related to network device management and activities.</p>
    </ReportsPageContainer>
  );
};

export default ReportsPage;

