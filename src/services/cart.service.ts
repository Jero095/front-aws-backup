// src/services/cart.service.ts
import API from './api';
import type { DetalleCarrito, DetalleCarritoDTO } from '../types/cart';

class CartService {
  async getCart(userId: number): Promise<DetalleCarrito[]> {
    console.log('[CART-SERVICE] Obteniendo carrito para usuario:', userId);
    const res = await API.get<DetalleCarrito[]>(`/api/carrito/${userId}`);
    console.log('[CART-SERVICE] Respuesta del carrito:', res.data);
    return res.data;
  }

  async addToCart(dto: DetalleCarritoDTO): Promise<DetalleCarrito> {
    console.log('[CART-SERVICE] Agregando al carrito:', dto);
    const res = await API.post<DetalleCarrito>('/api/carrito', dto);
    console.log('[CART-SERVICE] Item agregado:', res.data);
    return res.data;
  }

  async deleteCartItem(id: number): Promise<void> {
    await API.delete(`/api/carrito/${id}`);
  }

  async clearCart(userId: number): Promise<void> {
    await API.delete(`/api/carrito/vaciar/${userId}`);
  }
}

export default new CartService();
