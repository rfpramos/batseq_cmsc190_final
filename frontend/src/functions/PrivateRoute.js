// PrivateRoute.js
import React from 'react';
import { Route, Navigate } from 'react-router-dom';

// Simulated authentication check
const isAuthenticated = () => {
  return localStorage.getItem('isLoggedIn') === 'true';
};

const PrivateRoute = ({ element, ...rest }) => (
  <Route {...rest} element={isAuthenticated() ? element : <Navigate to="/" />} />
);

export default PrivateRoute;
