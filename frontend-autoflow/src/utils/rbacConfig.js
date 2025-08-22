// RBAC Configuration - Permissions par rôle
export const rolePermissions = {
  Admin: {
    sections: ['home', 'settings', 'devices', 'topology', 'monitoring', 'firewalling', 'help', 'agent', 'agent-ai-config', 'acls'],
    actions: {
      create: true,
      read: true,
      update: true,
      delete: true,
      execute: true,
      configure: true
    },
    color: '#dc3545', // Rouge pour Admin
    badge: '👑 Admin'
  },
  Network_Engineer: {
    sections: ['home', 'devices', 'topology', 'monitoring', 'help'],
    actions: {
      create: true,
      read: true,
      update: true,
      delete: false, // Pas de suppression
      execute: true,
      configure: true
    },
    color: '#4052D6', // Bleu harmonisé pour Network_Engineer
    badge: '🔧 Network Engineer'
  },
  Developer: {
    sections: ['home', 'devices', 'topology', 'monitoring', 'help', 'developer'],
    actions: {
      create: false,
      read: true,
      update: false,
      delete: false,
      execute: false,
      configure: false
    },
    color: '#28a745', // Vert pour Developer
    badge: '👨‍💻 Developer'
  },
  Viewer: {
    sections: ['home', 'devices', 'topology', 'monitoring', 'help'],
    actions: {
      create: false,
      read: true,
      update: false,
      delete: false,
      execute: false,
      configure: false
    },
    color: '#6c757d', // Gris pour Viewer
    badge: '👀 Viewer'
  }
};

// Fonctions utilitaires RBAC
export const getRolePermissions = (role) => {
  return rolePermissions[role] || rolePermissions.Viewer;
};

export const canAccessSection = (userRole, section) => {
  const permissions = getRolePermissions(userRole);
  return permissions.sections.includes(section);
};

export const canPerformAction = (userRole, action) => {
  const permissions = getRolePermissions(userRole);
  return permissions.actions[action] || false;
};

export const getRoleColor = (role) => {
  const permissions = getRolePermissions(role);
  return permissions.color;
};

export const getRoleBadge = (role) => {
  const permissions = getRolePermissions(role);
  return permissions.badge;
};

// Messages d'erreur selon le rôle
export const getAccessDeniedMessage = (action, resource) => {
  return `🔒 Access Denied: ${action} ${resource} requires Admin privileges`;
};

// Configuration des sections avec descriptions
export const sectionConfig = {
  home: {
    name: 'Home',
    icon: '🏠',
    description: 'Dashboard principal',
    adminOnly: false
  },
  settings: {
    name: 'Settings',
    icon: '⚙️',
    description: 'Configuration système (Admin only)',
    adminOnly: true
  },
  devices: {
    name: 'Devices',
    icon: '🖥️',
    description: 'Gestion des équipements réseau',
    adminOnly: false
  },
  topology: {
    name: 'Topology',
    icon: '🌐',
    description: 'Vue et modification de la topologie réseau',
    adminOnly: false
  },
  monitoring: {
    name: 'Monitoring',
    icon: '📊',
    description: 'Surveillance et monitoring réseau',
    adminOnly: false
  },
  firewalling: {
    name: 'Firewalling',
    icon: '🛡️',
    description: 'Configuration des pare-feu (Admin only)',
    adminOnly: true
  },
  help: {
    name: 'Help',
    icon: '❓',
    description: 'Aide et documentation',
    adminOnly: false
  },
  agent: {
    name: 'AI Agents',
    icon: '🧑‍💼',
    description: 'Agents de sécurité (Admin only)',
    adminOnly: true
  },
  'agent-ai-config': {
    name: 'AI Assistant',
    icon: '🤖',
    description: 'Configuration des agents IA (Admin only)',
    adminOnly: true
  },
  acls: {
    name: 'ACLs',
    icon: '🔐',
    description: 'Listes de contrôle d\'accès (Admin only)',
    adminOnly: true
  },
  developer: {
    name: 'Developer Dashboard',
    icon: '👨‍💻',
    description: 'Dashboard développeur',
    adminOnly: false
  }
}; 