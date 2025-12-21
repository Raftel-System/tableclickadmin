import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AuthGuard from './guards/AuthGuard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/talya-bercy/login" element={<Login />} />
        <Route
          path="/talya-bercy/dashboard"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />
        <Route path="*" element={<Navigate to="/talya-bercy/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
