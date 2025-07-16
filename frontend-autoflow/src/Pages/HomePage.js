import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Container = styled.div`
  text-align: center;
  padding: 0 32px 120px 32px;
  margin-top: 0;
  background: linear-gradient(120deg, #f9fafb 0%, #FFF9E5 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
`;

const Title = styled.h1`
  font-size: 54px;
  color: #1e3a8a;
  font-weight: 800;
  margin-bottom: 44px;
  background: linear-gradient(45deg, #1e3a8a, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 1.5px;
`;

const Subtitle = styled.p`
  font-size: 26px;
  color: #1A2A44;
  max-width: 950px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.22);
  border-radius: 22px;
  padding: 36px 0;
  box-shadow: 0 4px 24px rgba(30, 58, 138, 0.08);
  line-height: 1.6;
`;

const HomePage = () => {
  return (
    <Container as={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
      <Title>Bienvenue sur la plateforme Autoflow</Title>
      <Subtitle>
        Cette plateforme permet d'automatiser, de gérer et de sécuriser les configurations réseau de manière intuitive.<br/><br/>
        Profitez d'une interface moderne, de scripts puissants, et d'une visibilité complète sur vos équipements réseau.
      </Subtitle>
    </Container>
  );
};

export default HomePage;
