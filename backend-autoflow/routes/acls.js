import express from 'express';
const router = express.Router();

// Dummy ACL data for testing
const dummyAcls = [
  {
    name: 'ACL_101',
    type: 'standard',
    rules: ['permit 192.168.111.0 0.0.0.255', 'deny any']
  }
];

// GET /api/acls/:switchIp
router.get('/:switchIp', (req, res) => {
  // In real use, fetch ACLs for req.params.switchIp from DB or device
  res.json({ acls: dummyAcls });
});

export default router; 