import React, { useState } from 'react';
import MFAModal from './MFAModal';
import './MFATest.css';

const MFATest = () => {
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [testEmail, setTestEmail] = useState('sarra.bngharbia@gmail.com');

  const handleMFASuccess = (email) => {
    setVerifiedEmail(email);
    console.log('MFA verification successful for:', email);
  };

  const handleOpenMFA = () => {
    setShowMFAModal(true);
  };

  const handleCloseMFA = () => {
    setShowMFAModal(false);
  };

  return (
    <div className="mfa-test-container">
      <div className="mfa-test-card">
        <h2>🧪 Test MFA (Authentification à deux facteurs)</h2>
        
        <div className="mfa-test-section">
          <h3>Configuration actuelle :</h3>
          <div className="mfa-config-info">
            <p><strong>Email configuré :</strong> {testEmail}</p>
            <p><strong>Statut :</strong> 
              {verifiedEmail ? (
                <span className="status-success">✅ Vérifié</span>
              ) : (
                <span className="status-pending">⏳ En attente</span>
              )}
            </p>
          </div>
        </div>

        <div className="mfa-test-section">
          <h3>Actions :</h3>
          <div className="mfa-actions">
            <button 
              className="mfa-test-btn primary"
              onClick={handleOpenMFA}
            >
              🔐 Tester l'authentification MFA
            </button>
            
            {verifiedEmail && (
              <div className="mfa-success-message">
                <p>✅ Authentification réussie pour : <strong>{verifiedEmail}</strong></p>
                <button 
                  className="mfa-test-btn secondary"
                  onClick={() => setVerifiedEmail('')}
                >
                  🔄 Réinitialiser
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mfa-test-section">
          <h3>Comment ça fonctionne :</h3>
          <ol className="mfa-instructions">
            <li>Cliquez sur "Tester l'authentification MFA"</li>
            <li>Entrez votre adresse email</li>
            <li>Cliquez sur "Envoyer le code"</li>
            <li>Vérifiez votre email pour le code de 6 chiffres</li>
            <li>Entrez le code dans l'interface</li>
            <li>Cliquez sur "Vérifier le code"</li>
          </ol>
        </div>

        <div className="mfa-test-section">
          <h3>Fonctionnalités :</h3>
          <ul className="mfa-features">
            <li>✅ Envoi d'emails sécurisés</li>
            <li>✅ Codes à 6 chiffres générés automatiquement</li>
            <li>✅ Expiration automatique (5 minutes)</li>
            <li>✅ Limitation des tentatives (3 essais)</li>
            <li>✅ Interface utilisateur moderne</li>
            <li>✅ Gestion des erreurs</li>
          </ul>
        </div>
      </div>

      <MFAModal
        isOpen={showMFAModal}
        onClose={handleCloseMFA}
        onSuccess={handleMFASuccess}
        userEmail={testEmail}
      />
    </div>
  );
};

export default MFATest; 