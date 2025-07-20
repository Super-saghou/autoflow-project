import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SecurityAgentDashboard from './components/SecurityAgentDashboard';

// Debug imports
console.log('Login:', Login);
console.log('Dashboard:', Dashboard);
console.log('SecurityAgentDashboard:', SecurityAgentDashboard);

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/security-agent" element={<SecurityAgentDashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
