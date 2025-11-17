import React from 'react';
import { Typography, Container, Box } from '@mui/material';

const BillingPage = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestion de l'Abonnement
        </Typography>
        <Typography variant="body1">
          Ceci est la page de gestion de votre abonnement. Ici, vous pourrez choisir un plan, entrer vos informations de paiement et consulter l'historique de vos factures.
        </Typography>
        {/* TODO: Add plan selection, Stripe Payment Element, subscription status, etc. */}
      </Box>
    </Container>
  );
};

export default BillingPage;
