import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [newDevice, setNewDevice] = useState({ name: '', ip: '' });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(true); // État pour le menu rétractable
  const [isAccountOpen, setIsAccountOpen] = useState(false); // État pour le panneau de compte
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false); // État pour la page de modification
  const [userProfile, setUserProfile] = useState({ username: 'Sarra', email: 'sarra@example.com', password: '' }); // Données du profil
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/devices');
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des appareils');
        }
        const data = await response.json();
        setDevices(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchDevices();
  }, []);

  const handleAddDevice = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDevice),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l’ajout de l’appareil');
      }

      const data = await response.json();
      setMessage(data.message);
      setDevices([...devices, newDevice]);
      setNewDevice({ name: '', ip: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleAccount = () => {
    setIsAccountOpen(!isAccountOpen);
  };

  const openProfileEdit = () => {
    setIsProfileEditOpen(true);
    setIsAccountOpen(false); // Ferme le panneau de compte
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    const updatedProfile = {
      username: e.target.username.value || userProfile.username,
      email: e.target.email.value || userProfile.email,
      password: e.target.password.value || userProfile.password,
    };
    setUserProfile(updatedProfile);
    setIsProfileEditOpen(false);
    setMessage('Profil mis à jour avec succès !');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'linear-gradient(to bottom, #8B4513, #D2B48C)' }}>
      {/* Sidebar Menu */}
      <div
        style={{
          width: isMenuOpen ? '250px' : '60px',
          backgroundColor: '#F5F5DC',
          padding: '20px',
          boxShadow: '2px 0 5px rgba(0, 0, 0, 0.1)',
          transition: 'width 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: isMenuOpen ? 'space-between' : 'center', alignItems: 'center', marginBottom: '20px' }}>
          {isMenuOpen && <h3 style={{ color: '#8B4513', margin: 0 }}>Menu</h3>}
          <button
            onClick={toggleMenu}
            style={{
              background: 'none',
              border: 'none',
              color: '#8B4513',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            {isMenuOpen ? '←' : '→'}
          </button>
        </div>

        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '15px' }}>
            <button
              onClick={() => setActiveSection('home')}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: activeSection === 'home' ? '#8B4513' : '#D2B48C',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMenuOpen ? 'flex-start' : 'center',
              }}
            >
              <span style={{ marginRight: isMenuOpen ? '10px' : '0' }}>🏠</span>
              {isMenuOpen && 'Home'}
            </button>
          </li>
          <li style={{ marginBottom: '15px' }}>
            <button
              onClick={() => setActiveSection('configuration')}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: activeSection === 'configuration' ? '#8B4513' : '#D2B48C',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMenuOpen ? 'flex-start' : 'center',
              }}
            >
              <span style={{ marginRight: isMenuOpen ? '10px' : '0' }}>⚙️</span>
              {isMenuOpen && 'Configuration'}
            </button>
          </li>
          <li style={{ marginBottom: '15px' }}>
            <button
              onClick={() => setActiveSection('devices')}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: activeSection === 'devices' ? '#8B4513' : '#D2B48C',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMenuOpen ? 'flex-start' : 'center',
              }}
            >
              <span style={{ marginRight: isMenuOpen ? '10px' : '0' }}>📡</span>
              {isMenuOpen && 'Devices'}
            </button>
          </li>
          <li style={{ marginBottom: '15px' }}>
            <button
              onClick={() => setActiveSection('automation')}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: activeSection === 'automation' ? '#8B4513' : '#D2B48C',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMenuOpen ? 'flex-start' : 'center',
              }}
            >
              <span style={{ marginRight: isMenuOpen ? '10px' : '0' }}>🤖</span>
              {isMenuOpen && 'Automation'}
            </button>
          </li>
          <li style={{ marginBottom: '15px' }}>
            <button
              onClick={() => setActiveSection('settings')}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: activeSection === 'settings' ? '#8B4513' : '#D2B48C',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMenuOpen ? 'flex-start' : 'center',
              }}
            >
              <span style={{ marginRight: isMenuOpen ? '10px' : '0' }}>🔧</span>
              {isMenuOpen && 'Settings'}
            </button>
          </li>
          <li>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#8B4513',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMenuOpen ? 'flex-start' : 'center',
              }}
            >
              <span style={{ marginRight: isMenuOpen ? '10px' : '0' }}>🚪</span>
              {isMenuOpen && 'Logout'}
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content Area avec Icône de Compte et Bannière Animée */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto', backgroundColor: '#FFF8DC', color: '#8B4513', position: 'relative' }}>
        {/* Icône de Compte en Haut à Droite (Couleur Orange) */}
        <button
          onClick={toggleAccount}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: '#FFA500', // Couleur orange
            fontSize: '24px',
            cursor: 'pointer',
          }}
        >
          👤
        </button>

        {/* Panneau de Compte */}
        {isAccountOpen && (
          <div
            style={{
              position: 'absolute',
              top: '60px',
              right: '20px',
              backgroundColor: '#F5F5DC',
              padding: '15px',
              borderRadius: '10px',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
              width: '200px',
              zIndex: 10,
            }}
          >
            <h4 style={{ color: '#8B4513', margin: '0 0 10px 0' }}>Mon Compte</h4>
            <p>Utilisateur : {userProfile.username}</p>
            <p>Email : {userProfile.email}</p>
            <button
              onClick={openProfileEdit}
              style={{
                width: '100%',
                padding: '5px',
                backgroundColor: '#8B4513',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                marginTop: '10px',
                cursor: 'pointer',
              }}
            >
              Modifier le Profil
            </button>
          </div>
        )}

        {/* Page de Modification du Profil */}
        {isProfileEditOpen && (
          <div
            style={{
              position: 'fixed',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 20,
            }}
          >
            <div
              style={{
                backgroundColor: '#F5F5DC',
                padding: '20px',
                borderRadius: '10px',
                width: '300px',
                color: '#8B4513',
              }}
            >
              <h3>Modifier Mon Profil</h3>
              <form onSubmit={handleProfileUpdate}>
                <div style={{ marginBottom: '15px' }}>
                  <label>Nom d'utilisateur :</label>
                  <input
                    type="text"
                    name="username"
                    defaultValue={userProfile.username}
                    style={{
                      width: '100%',
                      padding: '5px',
                      marginTop: '5px',
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>Email :</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={userProfile.email}
                    style={{
                      width: '100%',
                      padding: '5px',
                      marginTop: '5px',
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label>Mot de passe :</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Nouveau mot de passe (facultatif)"
                    style={{
                      width: '100%',
                      padding: '5px',
                      marginTop: '5px',
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '5px 15px',
                      backgroundColor: '#8B4513',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    Sauvegarder
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsProfileEditOpen(false)}
                    style={{
                      padding: '5px 15px',
                      backgroundColor: '#D2B48C',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeSection === 'home' && (
          <div style={{ position: 'relative', minHeight: '80vh' }}>
            <h2 style={{ color: '#8B4513', textAlign: 'center' }}>Tableau de Bord - Automatisation Réseau</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
              Bienvenue, Sarra ! Cette plateforme vous permet de gérer et automatiser la configuration de vos routeurs et switches facilement. Simplifiez vos tâches réseau avec des outils puissants et intuitifs.
            </p>
            {/* Bannière Animée Inspirée des Designs Modernes */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80%',
                height: '150px',
                background: 'linear-gradient(45deg, #D2B48C, #8B4513)',
                borderRadius: '15px',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  background: 'url(https://media.giphy.com/media/l0HlRnAWXxn0MhKLK/giphy.gif) no-repeat center',
                  backgroundSize: 'contain',
                  opacity: 0.8,
                  animation: 'move 4s linear infinite',
                }}
              />
              <style>
                {`
                  @keyframes pulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.05); }
                  }
                  @keyframes move {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                  }
                `}
              </style>
            </div>
          </div>
        )}

        {activeSection === 'configuration' && (
          <div>
            <h2 style={{ color: '#8B4513' }}>Configuration</h2>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#8B4513', marginBottom: '10px' }}>Configurer Switch</h3>
              <form className="login-form">
                <div className="form-group">
                  <label>Nom :</label>
                  <input type="text" className="form-input" placeholder="Ex: Switch 1" />
                </div>
                <div className="form-group">
                  <label>IP :</label>
                  <input type="text" className="form-input" placeholder="Ex: 192.168.1.2" />
                </div>
                <button type="submit" className="login-btn">Configurer</button>
              </form>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#8B4513', marginBottom: '10px' }}>Configurer Routeur</h3>
              <form className="login-form">
                <div className="form-group">
                  <label>Nom :</label>
                  <input type="text" className="form-input" placeholder="Ex: Routeur 1" />
                </div>
                <div className="form-group">
                  <label>IP :</label>
                  <input type="text" className="form-input" placeholder="Ex: 192.168.1.3" />
                </div>
                <button type="submit" className="login-btn">Configurer</button>
              </form>
            </div>
            <div>
              <h3 style={{ color: '#8B4513', marginBottom: '10px' }}>Configurer Firewall</h3>
              <form className="login-form">
                <div className="form-group">
                  <label>Nom :</label>
                  <input type="text" className="form-input" placeholder="Ex: Firewall 1" />
                </div>
                <div className="form-group">
                  <label>IP :</label>
                  <input type="text" className="form-input" placeholder="Ex: 192.168.1.4" />
                </div>
                <button type="submit" className="login-btn">Configurer</button>
              </form>
            </div>
          </div>
        )}

        {activeSection === 'devices' && (
          <div>
            <h2 style={{ color: '#8B4513' }}>Appareils</h2>
            <div className="form-group">
              <h3 style={{ color: '#8B4513', fontSize: '18px', marginBottom: '10px' }}>Appareils Configurés</h3>
              {devices.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {devices.map((device, index) => (
                    <li
                      key={index}
                      style={{
                        padding: '10px',
                        borderBottom: '1px solid #ccc',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>{device.name} ({device.ip})</span>
                      <button
                        className="login-btn"
                        style={{ padding: '5px 10px', fontSize: '14px' }}
                        onClick={() => alert(`Lancement de la configuration pour ${device.name}`)}
                      >
                        Configurer
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Aucun appareil configuré pour le moment.</p>
              )}
            </div>
            <form onSubmit={handleAddDevice} className="login-form">
              <h3 style={{ color: '#8B4513', fontSize: '18px', marginBottom: '10px' }}>Ajouter un Nouvel Appareil</h3>
              <div className="form-group">
                <label>Nom de l’appareil :</label>
                <input
                  type="text"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="form-input"
                  placeholder="Ex: Routeur 1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Adresse IP :</label>
                <input
                  type="text"
                  value={newDevice.ip}
                  onChange={(e) => setNewDevice({ ...newDevice, ip: e.target.value })}
                  className="form-input"
                  placeholder="Ex: 192.168.1.1"
                  required
                />
              </div>
              {message && <p style={{ color: 'green' }}>{message}</p>}
              {error && <p style={{ color: 'red' }}>{error}</p>}
              <button type="submit" className="login-btn">Ajouter et Configurer</button>
            </form>
          </div>
        )}

        {activeSection === 'automation' && (
          <div>
            <h2 style={{ color: '#8B4513' }}>Automatisation</h2>
            <p>Section pour lancer des tâches d’automatisation. (À développer)</p>
          </div>
        )}

        {activeSection === 'settings' && (
          <div>
            <h2 style={{ color: '#8B4513' }}>Paramètres</h2>
            <p>Section pour gérer les paramètres. (À développer)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
