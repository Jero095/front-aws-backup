// src/services/auth.service.ts
import API from './api';
import type { User, RegistroUsuarioDTO } from '../types/user';

class AuthService {
  async login(email: string, password: string): Promise<User> {
    const response = await API.post('/api/auth/login', { email, password });
    const data = response.data;

    console.log('[AUTH] Respuesta login del backend:', data);

    // 🔑 TRANSFORMAR la respuesta plana del backend a objeto User
    const usuario: User = {
      id: data.userId || data.id,
      email: data.email,
      nombre: data.nombre || 'Usuario',
      apellido: data.apellido || '',
      rol: data.rol || 'CLIENTE',
      rolId: data.rolId || data.rol_id || (data.rol === 'ADMIN' ? 1 : 2)
    };

    console.log('[AUTH] Usuario transformado:', usuario);

    // Guardar en localStorage
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user_data', JSON.stringify(usuario));

    return usuario;
  }

  async register(dto: RegistroUsuarioDTO): Promise<User> {
    const response = await API.post('/api/auth/register', dto);
    const data = response.data;

    const usuario: User = {
      id: data.userId || data.id,
      email: data.email,
      nombre: data.nombre || dto.nombre,
      apellido: data.apellido || dto.apellido,
      rol: data.rol || 'CLIENTE',
      rolId: data.rolId || data.rol_id || 2  // Por defecto es CLIENTE
    };

    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user_data', JSON.stringify(usuario));

    return usuario;
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }
}

export default new AuthService();
