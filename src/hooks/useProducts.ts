'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/client'
import type { Product } from '../lib/types'

export function useProducts(category?: string) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const supabase = createClient()

      let query = supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('created_at', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) setError(error.message)
      else setProducts(data ?? [])

      setLoading(false)
    }

    fetch()
  }, [category])

  return { products, loading, error }
}

export function useProduct(slug: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) setError(error.message)
      else setProduct(data)

      setLoading(false)
    }

    fetch()
  }, [slug])

  return { product, loading, error }
}