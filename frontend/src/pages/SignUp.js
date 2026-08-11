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
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import logo from "../assets/images/logo.png";

import bg from "../assets/images/bg-gradient.png";

import BuildIcon from "@mui/icons-material/Build";

import { brand } from "../getLPTheme";
import { useNavigate } from 'react-router-dom';

const defaultTheme = createTheme({
  palette: {
    primary: {
      main: "#4CAF50",
    },
    secondary: {
      main: "#8BC34A",
    },
  },
});

export default function SignUp() {

  const navigate = useNavigate();
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "info",
  });

  const appStyle = {
    backgroundSize: "cover",
    backgroundPosition: "center",
    maxHeight: "100vh",
  };

  const handleSnackbarOpen = (message, severity = "info") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar((prev) => ({ ...prev, open: false }));
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
              Sign Up
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
                id="name"
                label="Full Name"
                name="name"
                autoFocus
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="repassword"
                label="Reenter Password"
                type="password"
                id="repassword"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, backgroundColor: brand[800], color: "#fff"} }
                onClick={
                  () => {
                    const email = document.getElementById("email").value;
                    const password = document.getElementById("password").value;
                    const username = document.getElementById("name").value;
                    const repassword = document.getElementById("repassword").value;

                    if (password !== repassword) {
                      handleSnackbarOpen("Passwords do not match", "error");
                      return;
                    }

                    if(!email || !password || !username) {
                      handleSnackbarOpen("Please fill all fields", "error");
                      return;
                    }
                    fetch('http://localhost:5000/api/signup', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ email, password, username })
                    }).then(response => response.json())
                      .then(data => {
                        console.log('Success:', data);
                        if (data.error) {
                          handleSnackbarOpen(data.error, "error");
                        } else {
                          handleSnackbarOpen('User created successfully', "success");
                          setTimeout(() => navigate('/'), 2000);
                        }
                      })
                      .catch((error) => {
                        console.error('Error:', error);
                        handleSnackbarOpen('An error occurred', "error");
                      });

                  }
                }
              >
                Submit
              </Button>
            
              <Grid container justifyContent="center" alignItems="center">
                <Grid item>
                  <Button
                    color="secondary"
                    startIcon={<BuildIcon />}
                    onClick={() =>  navigate('/developer')}
                  >
                    Sign in as Administrator
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Container>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </ThemeProvider>
  );
}