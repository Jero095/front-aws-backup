// src/types/product.ts
export interface Producto {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoriaId?: number;
  categoria?: {
    id: number;
    nombre: string;
  };
  imagenUrl?: string;
}

export interface ProductoDTO {
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoriaId: number;
  imagenUrl?: string;
}
