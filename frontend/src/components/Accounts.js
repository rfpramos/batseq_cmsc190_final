/**
 * @deprecated
 * LEGACY MATERIAL UI COMPONENT
 *
 * Status: Unused / Deprecated
 *
 * This file is part of the legacy Material UI implementation.
 * It is currently not imported or used anywhere in the project.
 *
 * Reason for retention:
 * - Backward compatibility
 * - For future reference on scaling the project
 * - Pending cleanup or refactor
 *
 * -------------------------------------------------------------------
 * Comment authored by:
 * Ramnick Francis P. Ramos
 * CINTERLABS Cohort 2024–2025
 * Student Number: 2021-00571
 * Date: 18/12/2025
 * -------------------------------------------------------------------
 */


import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/system';
import { useEffect, useState } from 'react';
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Block';
import IconButton from '@mui/material/IconButton';

import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import { Icon } from '@mui/material';

/*TESTIMONIALS COMPONENT
This component is used to display the users of the application and allow the admin to approve or restrict users. 

Based off of Material UI Testimonal Component: https://mui.com/material-ui/
*/
export default function Testimonials() {


  const restrictUser = (email) => {
    axios.post('http://localhost:5000/api/data/restrictUser', { email })
      .then(response => {
        console.log(response.data.message);
        // Optionally, update the users state to reflect the change
        setUsers(users.map(user => user.email === email ? { ...user, approved: 0 } : user));
      })
      .catch(error => {
        console.error('Error restricting user:', error);
      });
  };


  const approveUser = (email) => {
    axios.post('http://localhost:5000/api/data/approveUser', { email })

      .then(response => {
        console.log(response.data.message);
        // Optionally, update the users state to reflect the change
        setUsers(users.map(user => user.email === email ? { ...user, approved: 1 } : user));
      })  
      .catch(error => {
        console.error('Error approving user:', error);
      });
  };
  
  
const [users, setUsers] = useState([]);

useEffect(() => {
  axios
    .get("http://localhost:5000/api/data/getuser")
    .then((response) => {
      setUsers(response.data);

      // console.log(response.data); // This will print the fetched data to the console
    })
    .catch((error) => console.error("Error fetching data:", error));
}, []);
  const theme = useTheme();

  return (
    <Container
      id="testimonials"
      sx={{
        pt: { xs: 4, sm: 12 },
        pb: { xs: 8, sm: 16 },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: { xs: 3, sm: 6 },
      }}
    >
      <Box
        sx={{
          width: { sm: '100%', md: '60%' },
          textAlign: { sm: 'left', md: 'center' },
        }}
      >
        <Typography component="h2" variant="h4" color="text.primary">
          Users
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You can approve or reject users here.
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {users.map((user, index) => (
          <Grid item xs={12} sm={6} md={4} key={index} sx={{ display: 'flex' }}>
            <Card
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flexGrow: 1,
                p: 1,
              }}
            >
{/* 

This is how the users table is shown in the MySQL CLI:
// +------------+----------------------+------+-----+---------------------+-------------------------------+
// | Field      | Type                 | Null | Key | Default             | Extra                         |
// +------------+----------------------+------+-----+---------------------+-------------------------------+
// | id         | int(11)              | NO   | PRI | NULL                | auto_increment                |
// | username   | varchar(50)          | NO   | UNI | NULL                |                               |
// | password   | varchar(255)         | NO   |     | NULL                |                               |
// | email      | varchar(100)         | NO   | UNI | NULL                |                               |
// | role       | enum('admin','user') | NO   |     | user                |                               |
// | created_at | timestamp            | YES  |     | current_timestamp() |                               |
// | updated_at | timestamp            | YES  |     | current_timestamp() | on update current_timestamp() |
// | approved   | tinyint(1)           | YES  |     | 0                   |                               |
// +------------+----------------------+------+-----+---------------------+-------------------------------+ */}
<CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
  <Typography variant="h5" color="text.primary">
    {user.username}
  </Typography>
</CardContent>
<CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
  <Typography variant="p" color="text.primary">
    {user.approved ? 'Approved' : 'Restricted Access'}
  </Typography>
</CardContent>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  pr: 2,
                }}>
                
                <CardHeader
                  avatar={
                    <Icon sx={{color:'green'}}>
                      {user.role === 'admin' ? <BusinessIcon /> : <PersonIcon />}
                    </Icon>
                  }
                  title={user.email}
                  subheader={user.created_at}
                  action={
                    <>
                      <IconButton aria-label="edit" sx={{ color: 'green' }}
                 
                      onClick={() => approveUser(user.email)}
                      >
                        <CheckCircleIcon />
                      </IconButton>
                      <IconButton aria-label="delete" sx={{ color: 'green' }}
                      onClick={() => restrictUser(user.email)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  }
                />
            
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
