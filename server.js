const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4200;

// Servir archivos estáticos desde la carpeta dist
app.use(express.static(path.join(__dirname, 'dist/Front_BOANK/browser')));

// Todas las rutas redirigen al index.html para que Angular maneje el routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/Front_BOANK/browser/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});