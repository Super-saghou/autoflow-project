import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Container = styled.div`
  text-align: center;
  padding: 64px 24px;
  background: linear-gradient(120deg, #f9fafb 0%, #FFF9E5 100%);
  min-height: 100vh;
`;

const Title = styled.h1`
  font-size: 40px;
  color: #1e3a8a;
  font-weight: 700;
  margin-bottom: 28px;
  background: linear-gradient(45deg, #1e3a8a, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.p`
  font-size: 20px;
  color: #1A2A44;
  max-width: 700px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  padding: 18px 0;
  box-shadow: 0 2px 12px rgba(30, 58, 138, 0.06);
`;

const HomePage = () => {
  return (
    <Container as={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
      <Title>Bienvenue sur la plateforme Autoflow</Title>
      <Subtitle>
        Cette plateforme permet d'automatiser, de gérer et de sécuriser les configurations réseau de manière intuitive.
        Profitez d'une interface moderne, de scripts puissants, et d'une visibilité complète sur vos équipements réseau.
      </Subtitle>
    </Container>
  );
};

export default HomePage;
