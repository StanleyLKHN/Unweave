'use client'

import { useEffect, useState } from 'react'
import { products as allProducts } from '../lib/products-data'
import type { Product } from '../lib/types'

export function useProducts(category?: string) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    try {
      const filtered = allProducts
        .filter(p => p.in_stock)
        .filter(p => !category || p.category === category)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))

      setProducts(filtered)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [category])

  return { products, loading, error }
}

export function useProduct(slug: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const found = allProducts.find(p => p.slug === slug)

    if (found) {
      setProduct(found)
      setError(null)
    } else {
      setProduct(null)
      setError('Product not found')
    }

    setLoading(false)
  }, [slug])

  return { product, loading, error }
}