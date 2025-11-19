// src/types/user.ts
export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;        // 'CLIENTE' | 'ADMINISTRADOR' | 'ADMIN'
  rolId?: number;     // 0 = ADMIN, 1 = CLIENTE
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegistroUsuarioDTO {
  nombre: string;
  apellido: string;
  correo: string;     // El backend espera 'correo', no 'email'
  password: string;
  telefono?: string;
  rol: string;        // "cliente" o "admin" (por defecto "cliente")
}
