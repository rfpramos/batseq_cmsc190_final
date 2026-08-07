import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import logo from "../assets/images/logo.png"; // Adjust the path as necessary

import bg from "../assets/images/bg-gradient.png";

import PersonIcon from "@mui/icons-material/Person";

import { brand } from "../getLPTheme";
import { useNavigate } from "react-router-dom";

// function Copyright(props) {
//   return (
//     <Typography variant="body2" color="text.secondary" align="center" {...props}>
//       {'Copyright © '}
//       <Link color="inherit" href="https://mui.com/">
//         Your Website
//       </Link>{' '}
//       {new Date().getFullYear()}
//       {'.'}
//     </Typography>
//   );
// }

// TODO remove, this demo shouldn't need to reset the theme.

const defaultTheme = createTheme({
  palette: {
    primary: {
      main: "#4CAF50", // Custom shade of green for primary
    },
    secondary: {
      main: "#8BC34A", // Custom shade of green for secondary
    },
    // Additional shades of green or other colors can be added here
  },
});

export default function SignIn() {
  const navigate = useNavigate();
  const appStyle = {
    backgroundImage: `url(${bg})`,
    backgroundSize: "cover", // Cover the entire page
    backgroundPosition: "center", // Center the background image
    minHeight: "100vh", // Ensure it covers the full viewport height
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log({
      email: data.get("email"),
      password: data.get("password"),
    });
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <div style={appStyle}>
        <Container component="main" maxWidth="xs">
          <CssBaseline />
          <Box
            sx={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <img
              src={logo}
              alt="BATGIS"
              style={{ width: "100%", height: "auto", marginBottom: 20 }}
            />
            <Typography component="h1" variant="h5">
              Administrator's Sign in
            </Typography>
            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{ mt: 1 }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                name="email"
                label="Email"
                type="email"
                id="email"
                autoComplete="email"
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Admin's Pin"
                type="password"
                id="password"
                autoComplete="current-password"
              />

              <Button
                type="submit"
                id="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  backgroundColor: brand[800],
                  color: "#fff",
                }}
                onClick={async () => {

                  const email = document.getElementById("email").value;
                  const password = document.getElementById("password").value;
               
                
                  try {
                    const response = await fetch('http://localhost:5000/api/auth/admin', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ email, password }),
                    });
                    
                
                    const data = await response.json();
                  
                
                    if (response.status === 200) {
                      localStorage.setItem('userLoggedIn', 'true');
                      localStorage.setItem('isAdmin', 'true');
                      localStorage.setItem('email', email);
                      navigate("/home");
                    } else {
                      const button = document.getElementById("submit");
                      // Save the original color
                      const originalColor = button.style.backgroundColor;
                      // Change the color of the button
                      button.style.backgroundColor = "red"; // Change 'red' to your desired color
                      // Change the color back to the original after 3 seconds
                      setTimeout(() => {
                        button.style.backgroundColor = originalColor;
                      }, 1000);
                    }
                  } catch (error) {
                    console.error('Login failed:', error);
                    const button = document.getElementById("submit");
                    // Save the original color
                    const originalColor = button.style.backgroundColor;
                    // Change the color of the button
                    button.style.backgroundColor = "red"; // Change 'red' to your desired color
                    // Change the color back to the original after 3 seconds
                    setTimeout(() => {
                      button.style.backgroundColor = originalColor;
                    }, 1000);
                  }


                }}
              >
                Sign In
              </Button>
              <Button
                // variant="contained"
                color="secondary"
                startIcon={<PersonIcon />}
                onClick={() => navigate("/")}
              ></Button>
              {/* <Grid container>
              <Grid item xs>
                <Link href="#" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link href="#" variant="body2">
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid> */}
            </Box>
          </Box>
          {/* <Copyright sx={{ mt: 8, mb: 4 }} /> */}
        </Container>
      </div>
    </ThemeProvider>
  );
}
