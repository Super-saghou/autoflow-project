import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Container = styled.div`
  text-align: center;
  padding: 50px;
`;

const Title = styled.h1`
  font-size: 36px;
  color: #2c3e50;
  margin-bottom: 20px;
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: #555;
  max-width: 700px;
  margin: 0 auto;
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
