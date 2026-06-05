// frontend/src/lib/api.ts

import axios from 'axios'
import type {
  CreateCustomerInput,
  CreateOrderInput,
  CreateProductInput,
  Customer,
  DashboardSummary,
  Order,
  OrderSummary,
  Product,
  UpdateProductInput,
} from '@/types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const detail = error.response?.data?.detail
    let message = 'An unexpected error occurred'

    if (typeof detail === 'string') {
      message = detail
    } else if (Array.isArray(detail)) {
      message = detail.map((item: { msg?: string }) => item.msg || 'Validation error').join(', ')
    } else if (error.message) {
      message = error.message
    }

    return Promise.reject(new Error(message))
  },
)

export const getProducts = () => api.get<never, Product[]>('/api/products')
export const createProduct = (data: CreateProductInput) =>
  api.post<never, Product>('/api/products', data)
export const updateProduct = (id: string, data: UpdateProductInput) =>
  api.put<never, Product>(`/api/products/${id}`, data)
export const deleteProduct = (id: string) =>
  api.delete<never, null>(`/api/products/${id}`)

export const getCustomers = () => api.get<never, Customer[]>('/api/customers')
export const createCustomer = (data: CreateCustomerInput) =>
  api.post<never, Customer>('/api/customers', data)
export const deleteCustomer = (id: string) =>
  api.delete<never, null>(`/api/customers/${id}`)

export const getOrders = () => api.get<never, OrderSummary[]>('/api/orders')
export const getOrder = (id: string) => api.get<never, Order>(`/api/orders/${id}`)
export const createOrder = (data: CreateOrderInput) =>
  api.post<never, Order>('/api/orders', data)
export const deleteOrder = (id: string) =>
  api.delete<never, null>(`/api/orders/${id}`)

export const getDashboardSummary = () =>
  api.get<never, DashboardSummary>('/api/dashboard/summary')

export default api
