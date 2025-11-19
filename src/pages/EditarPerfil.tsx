// src/pages/EditarPerfil.tsx
import { useAuth } from '../contexts/AuthContext';
import '../Styles/EditarPerfil.css';

const EditarPerfil: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="perfil-page">
      <h1>Mi Perfil</h1>
      
      <div className="perfil-info">
        <div className="info-item">
          <label>Nombre:</label>
          <p>{user?.nombre}</p>
        </div>
        
        <div className="info-item">
          <label>Apellido:</label>
          <p>{user?.apellido}</p>
        </div>
        
        <div className="info-item">
          <label>Email:</label>
          <p>{user?.email}</p>
        </div>
        
        <div className="info-item">
          <label>Rol:</label>
          <p>{user?.rol}</p>
        </div>
      </div>
      
      <p className="note">
        Nota: El backend no tiene implementado el endpoint para actualizar perfil (GET/PUT /api/usuarios/:id devuelve 405)
      </p>
    </div>
  );
};

export default EditarPerfil;
