// src/services/product.service.ts
import API from './api';
import type { Producto, ProductoDTO } from '../types/product';

class ProductService {
  async getProducts(): Promise<Producto[]> {
    const res = await API.get<Producto[]>('/api/productos');
    return res.data;
  }

  async getProductById(id: number): Promise<Producto> {
    const res = await API.get<Producto>(`/api/productos/${id}`);
    return res.data;
  }

  async createProduct(dto: ProductoDTO): Promise<Producto> {
    const res = await API.post<Producto>('/api/productos', dto);
    return res.data;
  }

  async updateProduct(id: number, dto: ProductoDTO): Promise<Producto> {
    const res = await API.put<Producto>(`/api/productos/${id}`, dto);
    return res.data;
  }

  async deleteProduct(id: number): Promise<void> {
    await API.delete(`/api/productos/${id}`);
  }
}

export default new ProductService();
