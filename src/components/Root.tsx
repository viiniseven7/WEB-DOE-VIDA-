import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Toaster } from './ui/sonner';

export function Root() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <p>Carregando...</p>;
  }

  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}