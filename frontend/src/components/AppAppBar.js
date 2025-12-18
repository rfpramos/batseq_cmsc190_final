import * as React from "react";
import PropTypes from "prop-types";

import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import Drawer from "@mui/material/Drawer";
import MenuIcon from "@mui/icons-material/Menu";
import ToggleColorMode from "./ToggleColorMode";
import {useNavigate} from "react-router-dom";

import PhyloTree from "./PhyloTree";

//importing the logo
import logo from "../assets/images/logo.png"; // Adjust the path as necessary
import { IconButton } from "@mui/material";
import LogoutIcon from '@mui/icons-material/Logout'; // Step 1: Import LogoutIcon

const logoStyle = {
  width: "140px",
  height: "auto",
  cursor: "pointer",
};

function AppAppBar({ mode, toggleColorMode }) {

  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  const scrollToSection = (sectionId) => {
    const sectionElement = document.getElementById(sectionId);
    const offset = 128;
    if (sectionElement) {
      const targetScroll = sectionElement.offsetTop - offset;
      sectionElement.scrollIntoView({ behavior: "smooth" });
      window.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
      setOpen(false);
    }
  };

  const [phyloOpen, setPhyloOpen] = React.useState(false);

  return (
    <div>
      <AppBar
        position="fixed"
        sx={{
          boxShadow: 0,
          bgcolor: "transparent",
          backgroundImage: "none",
          mt: 2,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            variant="regular"
            sx={(theme) => ({
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              borderRadius: "999px",
              bgcolor:
                theme.palette.mode === "light"
                  ? "rgba(255, 255, 255, 0.4)"
                  : "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(24px)",
              maxHeight: 40,
              border: "1px solid",
              borderColor: "divider",
              boxShadow:
                theme.palette.mode === "light"
                  ? `0 0 1px rgba(85, 166, 246, 0.1), 1px 1.5px 2px -1px rgba(85, 166, 246, 0.15), 4px 4px 12px -2.5px rgba(85, 166, 246, 0.15)`
                  : "0 0 1px rgba(0, 255, 0, 0.4), 1px 1.5px 2px -1px rgba(2, 31, 59, 0.65), 4px 4px 12px -2.5px rgba(2, 31, 59, 0.65)",
            })}
          >
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                ml: "-18px",
                px: 0,
              }}
            >
              <img src={logo} style={{ ...logoStyle, padding: '20px' }} alt="logo of BATGIS" />
              <Box sx={{ display: { xs: "none", md: "flex" } }}>



              <MenuItem
                  onClick={() => scrollToSection("dashboard")}
                  sx={{ py: "6px", px: "12px" }}
                >
                  <Typography variant="body2" color="text.primary">
                    Dashboard
                  </Typography>
                </MenuItem>
                <MenuItem
                  onClick={() => scrollToSection("about")}
                  sx={{ py: "6px", px: "12px" }}
                >
                  <Typography variant="body2" color="text.primary">
                    About
                  </Typography>
                </MenuItem>


                <MenuItem
                  onClick={() => scrollToSection("blaster")}
                  sx={{ py: "6px", px: "12px" }}
                >
                  <Typography variant="body2" color="text.primary">
                    BLAST
                  </Typography>
                </MenuItem>

                
<MenuItem
  onClick={() => {
    // open an in-app popup/modal instead of a new browser window
    setPhyloOpen(true);
  }}
  sx={{ py: "6px", px: "12px" }}
>
  <Typography variant="body2" color="text.primary">
    View Phylogenetic Tree
  </Typography>
</MenuItem>


              </Box>
            </Box>
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                gap: 0.5,
                alignItems: "center",
              }}
            >
              <ToggleColorMode mode={mode} toggleColorMode={toggleColorMode} />
              <LogoutIcon color="primary"
              onClick ={() => {
                localStorage.removeItem("isAdmin")
                localStorage.removeItem("user")
                localStorage.removeItem("email")
                navigate("/")
             
              }
            }
              />
            </Box>
            <Box sx={{ display: { sm: "", md: "none" } }}>
              <Button
                variant="text"
                color="primary"
                aria-label="menu"
                onClick={toggleDrawer(true)}
                sx={{ minWidth: "30px", p: "4px" }}
              >
                <MenuIcon />
              </Button>
              <Drawer anchor="right" open={open} onClose={toggleDrawer(false)}>
                <Box
                  sx={{
                    minWidth: "60dvw",
                    p: 2,
                    backgroundColor: "background.paper",
                    flexGrow: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "end",
                      flexGrow: 1,
                    }}
                  >
                    <ToggleColorMode
                      mode={mode}
                      toggleColorMode={toggleColorMode}
                    />
                  </Box>
                  <MenuItem onClick={() => scrollToSection("dashboard")}>
                    Dashboard
                  </MenuItem>
                  <Divider />
                  <MenuItem>
                    <Button
                      color="primary"
                      variant="contained"
                      component="a"
                      href="/material-ui/getting-started/templates/sign-up/"
                      target="_blank"
                      sx={{ width: "100%" }}
                      onClick ={() => navigate("/")}
                    >
                      Sign up
                    </Button>
                  </MenuItem>
                </Box>
              </Drawer>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* In-app popup overlay for PhyloTree */}
      {phyloOpen && (
        <Box
          onClick={() => setPhyloOpen(false)}
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: (theme) => theme.zIndex.modal + 2,
            bgcolor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
            // allow the overlay to scroll if inner content is taller than viewport
            overflowY: "auto",
          }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              width: "min(1100px, 96vw)",
              // use maxHeight constrained by viewport and padding, and enable internal scroll
              maxHeight: "calc(92vh - 32px)",
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: 24,
              p: 2,
              display: "flex",
              flexDirection: "column",
              // ensure inner content can scroll
              overflow: "hidden",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button size="small" onClick={() => setPhyloOpen(false)}>
                Close
              </Button>
            </Box>
            <Box sx={{ flex: 1, overflowY: "auto", mt: 1 }}>
              <PhyloTree />
            </Box>
          </Box>
        </Box>
      )}
    </div>
  );
}

AppAppBar.propTypes = {
  mode: PropTypes.oneOf(["dark", "light"]).isRequired,
  toggleColorMode: PropTypes.func.isRequired,
};

export default AppAppBar;
