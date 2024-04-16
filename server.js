const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;

express()
  .use(express.static(path.join(__dirname, 'public'))) // assuming your game files are in a directory named 'public'
  .get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Serve your HTML file on all routes (helpful for single-page applications)
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
