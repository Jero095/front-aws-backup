// src/services/order.service.ts
import API from './api';
import type { Pedido, PedidoDTO } from '../types/order';

class OrderService {
  async createOrder(dto: PedidoDTO): Promise<Pedido> {
    console.log('[ORDER-SERVICE] Enviando POST a /api/pedidos');
    console.log('[ORDER-SERVICE] Body:', JSON.stringify(dto, null, 2));
    try {
      const res = await API.post<Pedido>('/api/pedidos', dto);
      console.log('[ORDER-SERVICE] Respuesta exitosa:', res.data);
      return res.data;
    } catch (error) {
      console.error('[ORDER-SERVICE] Error en POST /api/pedidos:', error);
      if (error instanceof Error) {
        console.error('[ORDER-SERVICE] Mensaje de error:', error.message);
      }
      
      // Intentar capturar la respuesta del servidor
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('[ORDER-SERVICE] Estado HTTP:', axiosError.response?.status);
        console.error('[ORDER-SERVICE] Respuesta del servidor:', axiosError.response?.data);
      }
      
      throw error;
    }
  }

  async getOrders(): Promise<Pedido[]> {
    const res = await API.get<Pedido[]>('/api/pedidos');
    return res.data;
  }

  async getOrderById(id: number): Promise<Pedido> {
    const res = await API.get<Pedido>(`/api/pedidos/${id}`);
    return res.data;
  }

  async updateOrderStatus(id: number, estado: string): Promise<Pedido> {
    console.log(`[ORDER-SERVICE] Actualizando estado del pedido ${id} a: ${estado}`);
    try {
      // Intentar con PATCH enviando solo el estado
      const res = await API.patch<Pedido>(`/api/pedidos/${id}`, { estadoPedido: estado });
      console.log('[ORDER-SERVICE] Estado actualizado exitosamente:', res.data);
      return res.data;
    } catch (error) {
      console.error('[ORDER-SERVICE] Error actualizando estado:', error);
      throw error;
    }
  }

  async deleteOrder(id: number): Promise<void> {
    await API.delete(`/api/pedidos/${id}`);
  }
}

export default new OrderService();
