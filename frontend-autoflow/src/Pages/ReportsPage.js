import React from 'react';
import styled from 'styled-components';

const ReportsPageContainer = styled.div`
  padding: 40px 24px;
  background: linear-gradient(120deg, #f9fafb 0%, #FFF9E5 100%);
  min-height: 100vh;
  font-family: 'Inter', 'Poppins', 'Roboto', Arial, sans-serif;
`;

const ReportsPageTitle = styled.h1`
  font-size: 36px;
  color: #1e3a8a;
  font-weight: 700;
  margin-bottom: 28px;
  background: linear-gradient(45deg, #1e3a8a, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const ReportsCard = styled.div`
  background: rgba(255, 255, 255, 0.18);
  border-radius: 18px;
  box-shadow: 0 4px 18px rgba(30, 58, 138, 0.08);
  padding: 32px 24px;
  max-width: 700px;
  margin: 0 auto;
  color: #1A2A44;
`;

const ReportsPage = () => {
  return (
    <ReportsPageContainer>
      <ReportsPageTitle>Reports</ReportsPageTitle>
      <ReportsCard>
      <p>This is where you can view reports related to network device management and activities.</p>
      </ReportsCard>
    </ReportsPageContainer>
  );
};

export default ReportsPage;

