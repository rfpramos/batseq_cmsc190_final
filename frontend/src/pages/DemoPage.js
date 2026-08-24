import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import LandingPage from './LandingPage';
import logo from '../assets/images/logo.png';

export default function DemoPage() {
  const [openDemoNotice, setOpenDemoNotice] = useState(true);

  useEffect(() => {
    // Seed demo session values so the UI behaves like a logged-in non-admin user.
    localStorage.setItem('userLoggedIn', 'true');
    localStorage.setItem('email', 'demo@batgis.local');
    localStorage.setItem('role', 'user');
    localStorage.setItem('isAdmin', 'false');
  }, []);

  return (
    <>
      <LandingPage isDemo />
      <Dialog
        open={openDemoNotice}
        onClose={() => setOpenDemoNotice(false)}
        aria-labelledby="demo-page-notice-title"
        aria-describedby="demo-page-notice-description"
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'primary.light',
            background:
              'linear-gradient(180deg, rgba(235,250,236,1) 0%, rgba(255,255,255,1) 72%)',
            boxShadow: '0 18px 48px rgba(0, 0, 0, 0.2)',
          },
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(2px)',
            backgroundColor: 'rgba(16, 24, 32, 0.45)',
          },
        }}
      >
        <DialogTitle id="demo-page-notice-title" sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
            <Box
              component="img"
              src={logo}
              alt="BATSEQ logo"
              sx={{ width: 38, height: 38, objectFit: 'contain' }}
            />
            <Typography
              variant="overline"
              sx={{ letterSpacing: 1.2, color: '#1b5e20', fontWeight: 700 }}
            >
              BATSEQ Interactive Preview
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Demo Mode
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box
            id="demo-page-notice-description"
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'rgba(255, 255, 255, 0.75)',
            }}
          >
            <Typography variant="body1" color="text.primary">
              This page is a deployed demo of the BATSEQ dashboard. It simulates a
              logged-in user so visitors can explore isolate records, sequence
              views, and analysis screens without creating an account.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              Upload and add-isolate actions are disabled in this demo to keep
              the dataset unchanged.
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Developed by
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ramnick Francis P. Ramos
          </Typography>

          <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 700 }}>
            Partner Organizations
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            University of the Philippines Los Banos Museum of Natural History
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Department of Science and Technology NICER Center for Assessment of Cave Ecosystems (CAVES)
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setOpenDemoNotice(false)}
            autoFocus
            sx={{
              backgroundColor: '#2e7d32',
              '&:hover': { backgroundColor: '#1b5e20' },
            }}
          >
            Continue to Demo
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
