// src/types/order.ts
export interface Pedido {
  id?: number;
  usuario?: {           // 🔑 Backend devuelve objeto anidado
    id: number;
    email?: string;
    nombre?: string;
    apellido?: string;
  };
  usuarioId?: number;   // Fallback para compatibilidad
  metodoPago?: { id: number; nombrePago?: string };
  metodoPagoId?: number;
  estadoPedido: string;
  direccionEnvio: string;
  totalPedido: number | string;  // Backend usa BigDecimal
  fechaPedido?: string;          // Campo principal del backend
  fechaCreacion?: string;        // Campo alternativo
  detalles?: DetallePedido[];
}

export interface DetallePedido {
  id?: number;
  pedidoId: number;
  productoId: number;
  cantidadProducto: number;
  precioUnitario: number;
  producto?: {
    id: number;
    nombre: string;
    precio: number;
  };
}

export interface PedidoDTO {
  usuarioId: number;
  metodoPagoId: number;
  estadoPedido: string;
  direccionEnvio: string;
  totalPedido: string;  // 🔑 IMPORTANTE: String para BigDecimal del backend
}

export interface DetallePedidoDTO {
  pedidoId: number;
  productoId: number;
  cantidadProducto: number;
  precioUnitario: number;
}
