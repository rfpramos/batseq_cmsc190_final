import { useEffect } from 'react';
import LandingPage from './LandingPage';

export default function DemoPage() {
  useEffect(() => {
    // Seed demo session values so the UI behaves like a logged-in non-admin user.
    localStorage.setItem('userLoggedIn', 'true');
    localStorage.setItem('email', 'demo@batgis.local');
    localStorage.setItem('role', 'user');
    localStorage.setItem('isAdmin', 'false');
  }, []);

  return <LandingPage isDemo />;
}
