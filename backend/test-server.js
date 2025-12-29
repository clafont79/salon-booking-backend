const express = require('express');
const app = express();
const PORT = 3002;

app.get('/', (req, res) => {
  res.json({ test: 'OK' });
});

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Test server listening on http://127.0.0.1:${PORT}`);
  console.log('Server address:', server.address());
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
