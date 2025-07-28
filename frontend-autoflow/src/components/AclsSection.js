import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, IconButton, Snackbar } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';

const SWITCH_IP = '192.168.111.198'; // TODO: Make dynamic if needed

const ACL_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'extended', label: 'Extended' }
];

const AclsSection = () => {
  const [acls, setAcls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newAcl, setNewAcl] = useState({ name: '', type: 'standard' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [ruleOpen, setRuleOpen] = useState(false);
  const [ruleAcl, setRuleAcl] = useState(null);
  const [newRule, setNewRule] = useState('');
  const [ruleLoading, setRuleLoading] = useState(false);
  const [ruleError, setRuleError] = useState('');
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyAcl, setApplyAcl] = useState(null);
  const [iface, setIface] = useState('Fa0/1');
  const [direction, setDirection] = useState('in');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState('');
  const [aclNumber, setAclNumber] = useState('');
  const [permitSubnet, setPermitSubnet] = useState('');
  const [permitWildcard, setPermitWildcard] = useState('');
  const [rules, setRules] = useState([]);
  const [currentRule, setCurrentRule] = useState('');
  const [aclResult, setAclResult] = useState('');
  const [aclLoading, setAclLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const validateIp = ip => /^\d{1,3}(\.\d{1,3}){3}$/.test(ip);
  const validateWildcard = mask => /^\d{1,3}(\.\d{1,3}){3}$/.test(mask);

  const handleAddRule = () => {
    if (currentRule.trim()) {
      setRules([...rules, currentRule.trim()]);
      setCurrentRule('');
    }
  };
  // For the multi-rule form
  const handleRemoveRuleLocal = idx => {
    setRules(rules.filter((_, i) => i !== idx));
  };
  const handleRefresh = () => {
    fetchAcls();
    setSnackbar({ open: true, message: 'ACLs rafraîchies', severity: 'info' });
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchAcls = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/acls/${SWITCH_IP}`, {
        headers: { ...getAuthHeaders() }
      });
      const data = await res.json();
      if (res.ok && data.acls) {
        setAcls(data.acls);
      } else {
        setError(data.error || 'Failed to fetch ACLs');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcls();
  }, []);

  // Create ACL
  const handleCreateAcl = async () => {
    setCreateLoading(true);
    setCreateError('');
    try {
      const res = await fetch('/api/acls/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ switchIp: SWITCH_IP, aclName: newAcl.name, aclType: newAcl.type })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCreateOpen(false);
        setNewAcl({ name: '', type: 'standard' });
        fetchAcls();
      } else {
        setCreateError(data.error || 'Failed to create ACL');
      }
    } catch (err) {
      setCreateError('Network error: ' + err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  // Add Rule to existing ACL (backend)
  const handleAddRuleToBackend = async () => {
    setRuleLoading(true);
    setRuleError('');
    try {
      const res = await fetch('/api/acls/add-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ switchIp: SWITCH_IP, aclName: ruleAcl.name, rule: newRule })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRuleOpen(false);
        setNewRule('');
        fetchAcls();
      } else {
        setRuleError(data.error || 'Failed to add rule');
      }
    } catch (err) {
      setRuleError('Network error: ' + err.message);
    } finally {
      setRuleLoading(false);
    }
  };

  // Remove Rule
  const handleRemoveRule = async (acl, rule) => {
    if (!window.confirm(`Supprimer la règle "${rule}" de ${acl.name} ?`)) return;
    try {
      const res = await fetch('/api/acls/remove-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ switchIp: SWITCH_IP, aclName: acl.name, rule })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchAcls();
      } else {
        alert(data.error || 'Erreur lors de la suppression de la règle');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    }
  };

  // Delete ACL
  const handleDeleteAcl = async (acl) => {
    if (!window.confirm(`Supprimer l'ACL ${acl.name} ?`)) return;
    setDeleteLoading(acl.name);
    try {
      const res = await fetch('/api/acls/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ switchIp: SWITCH_IP, aclName: acl.name })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchAcls();
      } else {
        alert(data.error || 'Erreur lors de la suppression de l’ACL');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setDeleteLoading('');
    }
  };

  // Apply ACL
  const handleApplyAcl = async () => {
    setApplyLoading(true);
    setApplyError('');
    try {
      const res = await fetch('/api/acls/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ switchIp: SWITCH_IP, aclName: applyAcl.name, iface, direction })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setApplyOpen(false);
        setIface('Fa0/1');
        setDirection('in');
        fetchAcls();
      } else {
        setApplyError(data.error || 'Erreur lors de l’application de l’ACL');
      }
    } catch (err) {
      setApplyError('Network error: ' + err.message);
    } finally {
      setApplyLoading(false);
    }
  };

  const handleCreateAclPlaybook = async () => {
    setAclLoading(true);
    setAclResult('');
    if (!aclNumber || !rules.length) {
      setSnackbar({ open: true, message: 'Numéro ACL et au moins une règle sont requis', severity: 'error' });
      setAclLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/create-acl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          aclNumber: Number(aclNumber),
          rules,
          switchIp: SWITCH_IP
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAclResult(data.message + '\n\n' + (data.output || ''));
        setSnackbar({ open: true, message: 'ACL créée et appliquée avec succès', severity: 'success' });
        setRules([]);
        setAclNumber('');
      } else {
        setAclResult('Erreur: ' + (data.error || ''));
        setSnackbar({ open: true, message: data.error || 'Erreur lors de la création de l’ACL', severity: 'error' });
      }
    } catch (err) {
      setAclResult('Erreur réseau: ' + err.message);
      setSnackbar({ open: true, message: 'Erreur réseau: ' + err.message, severity: 'error' });
    } finally {
      setAclLoading(false);
    }
  };

  return (
    <Box sx={{
      background: 'linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%)',
      borderRadius: 20,
      boxShadow: '0 4px 24px 0 rgba(59,130,246,0.10)',
      padding: '40px 32px',
      marginBottom: 24,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
    }}>
      <div style={{ fontSize: 54, color: '#2563eb', marginBottom: 12 }}>🛡️</div>
      <Typography variant="h4" sx={{ color: '#2563eb', fontWeight: 900, letterSpacing: 1, marginBottom: 1 }}>
        ACLs (Access Control Lists)
      </Typography>
      <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500, marginBottom: 3, textAlign: 'center', maxWidth: 600 }}>
        Gérez les listes de contrôle d'accès (ACL) pour contrôler le trafic réseau sur vos équipements. Créez, modifiez, appliquez et visualisez les ACLs sur vos switches et routeurs.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2, mb: 4, fontWeight: 700, fontSize: 18, borderRadius: 2, background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)' }}
        onClick={() => setCreateOpen(true)}
      >
        + Créer une ACL
      </Button>
      <Box sx={{ mb: 4, p: 2, border: '1px solid #cbd5e1', borderRadius: 2, background: '#f8fafc' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Créer et appliquer une ACL standard (multi-règles)</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField label="Numéro ACL" type="number" value={aclNumber} onChange={e => setAclNumber(e.target.value)} size="small" />
          <TextField label="Nouvelle règle (ex: permit 192.168.111.0 0.0.0.255)" value={currentRule} onChange={e => setCurrentRule(e.target.value)} size="small" />
          <Button variant="outlined" onClick={handleAddRule} disabled={!currentRule.trim()}>Ajouter la règle</Button>
          <Button variant="outlined" onClick={handleRefresh}>Rafraîchir les ACLs</Button>
        </Box>
        {rules.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Règles à appliquer :</Typography>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {rules.map((rule, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {rule}
                  <Button size="small" color="error" onClick={() => handleRemoveRuleLocal(idx)}>Supprimer</Button>
                </li>
              ))}
            </ul>
          </Box>
        )}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Aperçu des commandes générées :</Typography>
          <Paper sx={{ p: 1, background: '#f1f5f9', fontFamily: 'monospace', fontSize: 15 }}>
            {rules.map((rule, idx) => `access-list ${aclNumber} ${rule}`).join('\n') || 'Aucune règle'}
          </Paper>
        </Box>
        <Button variant="contained" onClick={handleCreateAclPlaybook} disabled={aclLoading || !aclNumber || !rules.length}>
          {aclLoading ? <CircularProgress size={18} /> : 'Créer et appliquer ACL'}
        </Button>
        {aclResult && (
          <Alert severity={aclResult.startsWith('Erreur') ? 'error' : 'success'} sx={{ whiteSpace: 'pre-wrap', mt: 2 }}>
            {aclResult}
          </Alert>
        )}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          ContentProps={{ style: { background: snackbar.severity === 'success' ? '#22c55e' : snackbar.severity === 'error' ? '#ef4444' : '#2563eb', color: '#fff', fontWeight: 600 } }}
        />
      </Box>
      {loading ? (
        <CircularProgress sx={{ mt: 4 }} />
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2, borderRadius: 4, boxShadow: '0 2px 8px rgba(59,130,246,0.06)', minWidth: 420 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#e0e7ff' }}>
                <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>Nom</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>Règles</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {acls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ color: '#64748b', fontStyle: 'italic' }}>
                    Aucune ACL trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                acls.map((acl, idx) => (
                  <TableRow key={acl.name + idx}>
                    <TableCell sx={{ fontWeight: 700 }}>{acl.name}</TableCell>
                    <TableCell>{acl.type}</TableCell>
                    <TableCell>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {acl.rules.map((rule, i) => (
                          <li key={i} style={{ color: '#1e293b', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {rule}
                            <IconButton size="small" color="error" onClick={() => handleRemoveRule(acl, rule)} title="Supprimer la règle">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </li>
                        ))}
                      </ul>
                      <Button size="small" startIcon={<AddIcon />} sx={{ mt: 1, fontWeight: 600 }} onClick={() => { setRuleAcl(acl); setRuleOpen(true); }}>Ajouter une règle</Button>
                    </TableCell>
                    <TableCell>
                      <Button size="small" color="primary" startIcon={<PlaylistAddCheckIcon />} sx={{ mb: 1, fontWeight: 600 }} onClick={() => { setApplyAcl(acl); setApplyOpen(true); }}>Appliquer</Button>
                      <Button size="small" color="error" startIcon={<DeleteIcon />} sx={{ fontWeight: 600 }} onClick={() => handleDeleteAcl(acl)} disabled={deleteLoading === acl.name}>{deleteLoading === acl.name ? <CircularProgress size={18} /> : 'Supprimer'}</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create ACL Modal */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <DialogTitle>Créer une nouvelle ACL</DialogTitle>
        <DialogContent sx={{ minWidth: 340 }}>
          <TextField
            label="Nom de l'ACL"
            value={newAcl.name}
            onChange={e => setNewAcl({ ...newAcl, name: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            select
            label="Type"
            value={newAcl.type}
            onChange={e => setNewAcl({ ...newAcl, type: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
          >
            {ACL_TYPES.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
          {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} color="inherit">Annuler</Button>
          <Button onClick={handleCreateAcl} variant="contained" color="primary" disabled={createLoading || !newAcl.name.trim()}>{createLoading ? <CircularProgress size={20} /> : 'Créer'}</Button>
        </DialogActions>
      </Dialog>

      {/* Add Rule Modal */}
      <Dialog open={ruleOpen} onClose={() => setRuleOpen(false)}>
        <DialogTitle>Ajouter une règle à {ruleAcl?.name}</DialogTitle>
        <DialogContent sx={{ minWidth: 340 }}>
          <TextField
            label="Règle (ex: permit ip any any)"
            value={newRule}
            onChange={e => setNewRule(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          {ruleError && <Alert severity="error" sx={{ mb: 2 }}>{ruleError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleOpen(false)} color="inherit">Annuler</Button>
          <Button onClick={handleAddRuleToBackend} variant="contained" color="primary" disabled={ruleLoading || !newRule.trim()}>{ruleLoading ? <CircularProgress size={20} /> : 'Ajouter'}</Button>
        </DialogActions>
      </Dialog>

      {/* Apply ACL Modal */}
      <Dialog open={applyOpen} onClose={() => setApplyOpen(false)}>
        <DialogTitle>Appliquer {applyAcl?.name} à une interface</DialogTitle>
        <DialogContent sx={{ minWidth: 340 }}>
          <TextField
            label="Interface (ex: Fa0/1)"
            value={iface}
            onChange={e => setIface(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            select
            label="Direction"
            value={direction}
            onChange={e => setDirection(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          >
            <MenuItem value="in">Entrant (in)</MenuItem>
            <MenuItem value="out">Sortant (out)</MenuItem>
          </TextField>
          {applyError && <Alert severity="error" sx={{ mb: 2 }}>{applyError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyOpen(false)} color="inherit">Annuler</Button>
          <Button onClick={handleApplyAcl} variant="contained" color="primary" disabled={applyLoading || !iface.trim()}>{applyLoading ? <CircularProgress size={20} /> : 'Appliquer'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AclsSection; 