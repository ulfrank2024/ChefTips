// server.js
require("dotenv").config();
const express = require("express");
const cors = require('cors'); // Add this line
const authRoutes = require("./routes/authRoutes");

const app = express();

// Configure CORS to allow your web application's origin
app.use(cors({
    origin: 'http://localhost:5173', // Allow your web app's origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow necessary HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow necessary headers
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