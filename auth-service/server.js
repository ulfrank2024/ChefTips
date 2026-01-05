// server.js
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
console.log('NODE_ENV au début de server.js:', process.env.NODE_ENV);
console.log('FRONTEND_URL au début de server.js:', process.env.FRONTEND_URL);

const express = require("express");
const cors = require('cors'); // Add this line
const authRoutes = require("./routes/authRoutes");

const app = express();

// Health check endpoint for the load balancer
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Configure CORS to allow your web application's origin
app.use(cors({
    origin: ['http://localhost:5173', 'https://tips-app-main.vercel.app', 'https://www.cheftips.app', 'https://admin-web-app-gray.vercel.app'], // Autoriser votre application web's origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Autoriser les méthodes HTTP nécessaires
    allowedHeaders: ['Content-Type', 'Authorization'], // Autoriser les en-têtes nécessaires
}));

app.use(express.json());

// Définition des routes
// Chaque route de authRoutes sera préfixée par '/api/auth'
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;

// Start the server only if this file is run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Service d'authentification démarré sur le port ${PORT}`);
    });
}

module.exports = app; // Exporter l'application pour les tests