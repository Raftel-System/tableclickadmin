import { Navigate } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  // Pour l'instant, on vérifie juste si un token est présent dans localStorage
  // Vous pouvez améliorer cela avec Firebase Auth plus tard
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (!isAuthenticated) {
    return <Navigate to="/talya-bercy/login" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
