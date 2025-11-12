import { useAuthContext } from '../contexts/AuthContext';

const useAuth = () => {
  const {
    auth,
    isAuthenticated,
    login,
    logout,
    role,
    name,
    email,
    locationId,
    location,
  } = useAuthContext();
  return {
    auth,
    isAuthenticated,
    login,
    logout,
    role,
    name,
    email,
    locationId,
    location,
  };
};

export default useAuth;

