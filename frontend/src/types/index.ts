// frontend/src/types/index.ts

export interface Product {
  id: string
  name: string
  sku: string
  price: number
  quantity_in_stock: number
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  full_name: string
  email: string
  phone_number: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  product_id: string
  product_name: string
  sku: string
  quantity: number
  price_at_order: number
  subtotal: number
}

export interface OrderSummary {
  id: string
  customer_id: string
  customer_name: string
  total_amount: number
  created_at: string
  items_count: number
}

export interface Order {
  id: string
  customer: Customer
  total_amount: number
  created_at: string
  items: OrderItem[]
}

export interface DashboardSummary {
  total_products: number
  total_customers: number
  total_orders: number
  low_stock_products: Product[]
}

export interface CreateProductInput {
  name: string
  sku: string
  price: number
  quantity_in_stock: number
}

export interface UpdateProductInput {
  name?: string
  sku?: string
  price?: number
  quantity_in_stock?: number
}

export interface CreateCustomerInput {
  full_name: string
  email: string
  phone_number: string
}

export interface OrderItemInput {
  product_id: string
  quantity: number
}

export interface CreateOrderInput {
  customer_id: string
  items: OrderItemInput[]
}
