import React from 'react';
import { Link } from 'react-router-dom';
import { Box, List, ListItem, ListItemText } from '@mui/material';

const Sidebar = () => {
  return (
    <Box sx={{ width: 250, height: '100vh', bgcolor: 'primary.dark', color: 'white' }}>
      <List>
        <ListItem button component={Link} to="/">
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button component={Link} to="/restaurants">
          <ListItemText primary="Restaurants" />
        </ListItem>
        <ListItem button component={Link} to="/plans">
          <ListItemText primary="Plans" />
        </ListItem>
        <ListItem button component={Link} to="/settings">
          <ListItemText primary="Settings" />
        </ListItem>
      </List>
    </Box>
  );
};

export default Sidebar;
