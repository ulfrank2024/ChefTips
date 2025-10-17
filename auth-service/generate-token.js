const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' }); // Load .env from current directory

const payload = {
    id: "tip-service-id", // Un identifiant unique pour le tip-service
    role: "service", // Un rôle pour identifier qu'il s'agit d'un service
    company_id: "e879bb2a-72b7-4210-845f-f62e8073ace7", // <--- REMPLACEZ CECI PAR L'ID DE VOTRE COMPAGNIE
};

const secret = process.env.JWT_SECRET;

if (!secret) {
    console.error('JWT_SECRET not found in .env file. Please ensure it is set.');
    process.exit(1);
}

const token = jwt.sign(payload, secret, { expiresIn: '1y' }); // Jeton valide pour 1 an

console.log('Generated Inter-Service JWT Token:');
console.log(token);
