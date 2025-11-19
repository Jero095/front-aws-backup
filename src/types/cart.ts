// src/types/cart.ts
export interface DetalleCarrito {
  id?: number;
  usuarioId: number;
  productoId: number;
  cantidadProducto: number;  // Backend usa este nombre
  cantidad?: number;          // Alias para compatibilidad
  precioUnitario?: number;
  producto?: {
    id: number;
    nombre: string;
    precio: number;
    descripcion?: string;
    imagenUrl?: string;
  };
}

export interface DetalleCarritoDTO {
  usuarioId: number;
  productoId: number;
  cantidadProducto: number;  // Backend espera este campo
  precioUnitario: number;     // Backend requiere este campo
}
