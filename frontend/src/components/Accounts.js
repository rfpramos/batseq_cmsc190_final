import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';

import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LockIcon from '@mui/icons-material/Lock';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmailIcon from '@mui/icons-material/Email';

const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '';
  }

  return 'http://localhost:8080';
};

const API_BASE_URL = getApiBaseUrl();

const formatDateTime = (value) => {
  if (!value) {
    return 'Unavailable';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const roleMeta = {
  admin: {
    label: 'Administrator',
    color: 'error',
    icon: <AdminPanelSettingsIcon fontSize="small" />,
  },
  user: {
    label: 'Standard User',
    color: 'primary',
    icon: <VerifiedUserIcon fontSize="small" />,
  },
};

export default function Accounts() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/data/getuser`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const summary = useMemo(() => {
    const total = users.length;
    const admins = users.filter((user) => user.role === 'admin').length;
    const active = users.filter((user) => Number(user.approved) === 1).length;
    const restricted = total - active;
    const uploadedSamples = users.reduce((count, user) => count + (Number(user.uploaded_sample_count) || 0), 0);

    return { total, admins, active, restricted, uploadedSamples };
  }, [users]);

  const updateApprovalState = async (email, approved) => {
    const endpoint = approved ? '/api/data/approveUser' : '/api/data/restrictUser';
    try {
      await axios.post(`${API_BASE_URL}${endpoint}`, { email });
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.email === email ? { ...user, approved: approved ? 1 : 0 } : user
        )
      );
    } catch (error) {
      console.error(`Error updating access for ${email}:`, error);
    }
  };

  return (
    <Container
      id="accounts"
      maxWidth="xl"
      sx={{
        mt: { xs: 10, sm: 12 },
        px: { xs: 2, sm: 3, md: 4 },
        pt: { xs: 2, sm: 4 },
        pb: { xs: 8, sm: 12 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          mb: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(18,94,54,0.96) 0%, rgba(22,163,74,0.94) 52%, rgba(132,204,22,0.92) 100%)',
          color: 'common.white',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Stack spacing={2}>
          <Box>
            <Chip
              icon={<LockIcon />}
              label="Role-Based Access Control"
              sx={{ mb: 2, color: 'common.white', borderColor: 'rgba(255,255,255,0.28)' }}
              variant="outlined"
            />
            <Typography component="h2" variant="h3" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              Accounts & access posture
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, maxWidth: 760, color: 'rgba(255,255,255,0.78)' }}>
              Review who can sign in, which users are admins, and which accounts are currently approved or restricted.
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Total users
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {summary.total}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Admins
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {summary.admins}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Approved access
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {summary.active}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    Uploaded samples
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {summary.uploadedSamples}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <Box sx={{ mb: 3 }}>
        <Typography component="h3" variant="h5" sx={{ fontWeight: 700 }}>
          Current users
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Each card shows the user&apos;s role, access state, and account timestamps.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {isLoading ? (
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography color="text.secondary">Loading users...</Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          users.map((user) => {
            const isAdmin = user.role === 'admin';
            const isApproved = Number(user.approved) === 1;
            const roleInfo = roleMeta[user.role] || roleMeta.user;

            return (
              <Grid item xs={12} md={6} lg={4} key={user.id ?? user.email} sx={{ display: 'flex' }}>
                <Card
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    flexGrow: 1,
                    borderRadius: 4,
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 14px 40px rgba(15, 23, 42, 0.08)',
                  }}
                >
                  <CardContent sx={{ pb: 1.5 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Avatar sx={{ bgcolor: isAdmin ? 'error.main' : 'primary.main' }}>
                        {isAdmin ? <BusinessIcon /> : <PersonIcon />}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                          {user.username}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                          <Chip icon={roleInfo.icon} label={roleInfo.label} color={roleInfo.color} size="small" />
                          <Chip
                            icon={isApproved ? <CheckCircleIcon /> : <BlockIcon />}
                            label={isApproved ? 'Approved' : 'Restricted'}
                            color={isApproved ? 'success' : 'default'}
                            size="small"
                            variant={isApproved ? 'filled' : 'outlined'}
                          />
                        </Stack>
                      </Box>
                    </Stack>

                    <Stack spacing={1.25} sx={{ color: 'text.secondary' }}>
                      <Stack direction="row" spacing={1.1} alignItems="center">
                        <EmailIcon fontSize="small" />
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {user.email}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1.1} alignItems="center">
                        <AccessTimeIcon fontSize="small" />
                        <Typography variant="body2">Created: {formatDateTime(user.created_at)}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1.1} alignItems="center">
                        <AccessTimeIcon fontSize="small" />
                        <Typography variant="body2">Updated: {formatDateTime(user.updated_at)}</Typography>
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        Uploaded samples ({Number(user.uploaded_sample_count) || 0})
                      </Typography>

                      {Array.isArray(user.uploaded_samples) && user.uploaded_samples.length > 0 ? (
                        <Stack spacing={1}>
                          {user.uploaded_samples.slice(0, 3).map((sample) => (
                            <Box
                              key={sample.isolate_code}
                              sx={{
                                p: 1.25,
                                borderRadius: 2,
                                bgcolor: 'rgba(15, 23, 42, 0.04)',
                                border: '1px solid rgba(15, 23, 42, 0.08)',
                              }}
                            >
                              <Stack spacing={0.3}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                  {sample.isolate_code}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {sample.type_of_sample} · {sample.sampling_site}
                                </Typography>
                              </Stack>
                            </Box>
                          ))}

                          {user.uploaded_samples.length > 3 ? (
                            <Typography variant="caption" color="text.secondary">
                              +{user.uploaded_samples.length - 3} more sample(s)
                            </Typography>
                          ) : null}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No uploaded samples recorded for this account.
                        </Typography>
                      )}
                    </Box>
                  </CardContent>

                  <CardContent sx={{ pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {isAdmin ? 'Privileged account' : 'Standard account'}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant={isApproved ? 'outlined' : 'contained'}
                        color="success"
                        onClick={() => updateApprovalState(user.email, true)}
                        disabled={isApproved}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant={!isApproved ? 'outlined' : 'contained'}
                        color="error"
                        onClick={() => updateApprovalState(user.email, false)}
                        disabled={!isApproved}
                      >
                        Restrict
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>
    </Container>
  );
}
