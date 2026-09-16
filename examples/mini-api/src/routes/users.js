const express = require('express');
const userRepository = require('../db/userRepository');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(userRepository.list());
});

router.get('/:id', (req, res) => {
  const user = userRepository.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

router.post('/', requireAuth, (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  const user = userRepository.create({ name, email });
  res.status(201).json(user);
});

module.exports = router;
