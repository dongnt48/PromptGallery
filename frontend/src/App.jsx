import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import MyPrompts from './pages/MyPrompts';
import Bookmarks from './pages/Bookmarks';
import LoginSuccess from './pages/LoginSuccess';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <Router>
      <NotificationProvider>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/my-prompts" element={<MyPrompts />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/login-success" element={<LoginSuccess />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </NotificationProvider>
    </Router>
  );
}

export default App;
