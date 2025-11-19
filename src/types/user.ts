// src/types/user.ts
export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;        // 'CLIENTE' | 'ADMINISTRADOR' | 'ADMIN'
  rolId?: number;     // 1 = ADMIN, 2 = CLIENTE
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegistroUsuarioDTO {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
}
