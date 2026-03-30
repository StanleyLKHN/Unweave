export type ProductStatus = 'draft' | 'preorder' | 'in_production' | 'delivered'

export type Product = {
  id: string
  name: string
  slug: string
  price: number
  material: string
  description: string
  category: 'outerwear' | 'dresses' | 'sets' | 'accessories'
  images: string[]
  is_zero_waste: boolean
  in_stock: boolean
  status: ProductStatus
  preorder_target: number
  preorder_count: number
  created_at: string
}

export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export type Order = {
  id: string
  user_id: string
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered'
  total: number
  items: OrderItem[]
  created_at: string
}

export type OrderItem = {
  product_id: string
  quantity: number
  price: number
}

export type WishlistItem = {
  id: string
  user_id: string
  product_id: string
  created_at: string
}

export type CourseModule = {
  id: string
  title: string
  slug: string
  description: string
  lesson_count: number
  order: number
  is_published: boolean
}