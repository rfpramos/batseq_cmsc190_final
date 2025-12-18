// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignIn from './pages/SignIn';
import LandingPage from './pages/LandingPage';
import DeveloperMode from './pages/DeveloperMode';
import SignUp from './pages/SignUp';
import AdminLanding from './pages/AdminLanding';


import bg from "./assets/images/bg-gradient.png";

function App() {

  
  const appStyle = {
    backgroundImage: `url(${bg})`,
    backgroundSize: "cover", // Cover the entire page
    backgroundPosition: "center", // Center the background image
    maxHeight: "100vh", // Ensure it covers the full viewport height
  };
  
  return (
    <div style={{appStyle}}>
   
    <Router>
      <Routes>
        <Route exact path="/" element={<SignIn />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/developer" element={<DeveloperMode />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/admin" element={<AdminLanding />} />
      </Routes>
    </Router>
    </div>
  );
}

export default App;
