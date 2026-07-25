import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainDashboard from './pages/MainDashboard';
import KardexOperativo from './pages/KardexOperativo';
import AdminPanel from './pages/AdminPanel';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<MainDashboard />} />
        <Route path="/kardex" element={<KardexOperativo />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
