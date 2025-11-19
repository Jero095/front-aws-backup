// src/components/Navbar.tsx
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="logo">HydroSyS</Link>
      
      <div className="nav-links">
        {!user ? (
          // Usuario NO logueado
          <>
            <Link to="/login">Iniciar Sesión</Link>
            <Link to="/register">Registrarse</Link>
          </>
        ) : user.rol === 'ADMINISTRADOR' || user.rol === 'ADMIN' ? (
          // Administrador
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/productos">Productos</Link>
            <Link to="/pedidos">Pedidos</Link>
            <Link to="/perfil">Perfil</Link>
            <button onClick={logout}>Cerrar Sesión</button>
          </>
        ) : (
          // Cliente
          <>
            <Link to="/productos">Productos</Link>
            <Link to="/carrito">Carrito</Link>
            <Link to="/pedidos">Mis Pedidos</Link>
            <Link to="/perfil">Perfil</Link>
            <button onClick={logout}>Cerrar Sesión</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
