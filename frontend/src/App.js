import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from "./components/Header";
import Hero from "./components/Hero";
import Steeps from "./components/Steeps";
import Advantages from "./components/Advantages";
import BusinessStages from "./components/BusinessStages";
import CompanyTypes from "./components/CompanyTypes";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ"
import Contact from "./components/Contact"
import Footer from "./components/Footer"
import Login from './pages/Login';
import Register from './pages/Register';
import ClientWelcome from './pages/ClientWelcome';
import AdminDashboard from './pages/AdminDashboard';
import ExpertDashboard from './pages/ExpertDashboard';
import "./App.css";
import "./styles.css";

// Composant pour protéger les routes
const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem('token');
  return token ? element : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="app">
              <Header />
              <main>
                <Hero />
                <Steeps />
                <Advantages />
                <BusinessStages />
                <CompanyTypes />
                <Testimonials />
                <FAQ />
                <Contact />
                <Footer/>
              </main>
            </div>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/client"
          element={<ProtectedRoute element={<ClientWelcome />} />}
        />
        <Route
          path="/admin"
          element={<ProtectedRoute element={<AdminDashboard />} />}
        />
        <Route
          path="/expert"
          element={<ProtectedRoute element={<ExpertDashboard />} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
