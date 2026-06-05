// frontend/src/pages/ProductsPage.tsx

import { motion } from 'framer-motion'
import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Sheet } from '@/components/ui/Sheet'
import { useOpenCreateFromNavigation } from '@/hooks/useOpenCreateFromNavigation'
import { useToast } from '@/hooks/useToast'
import { clearPendingCreate } from '@/lib/openCreate'
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from '@/lib/api'
import { inputClassName, selectClassName } from '@/lib/form'
import {
  amountCellClass,
  formatCurrency,
  formatRelative,
  getStockBadgeVariant,
  getStockLabel,
} from '@/lib/format'
import type { Product } from '@/types'

type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'
  | 'stock-asc'
  | 'stock-desc'
  | 'newest'

type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock'

const emptyForm = {
  name: '',
  sku: '',
  price: '',
  quantity_in_stock: '',
}

export default function ProductsPage() {
  const { success, error: toastError } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getProducts()
      setProducts(data)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [toastError])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const openCreate = useCallback(() => {
    setEditingProduct(null)
    setForm(emptyForm)
    setFieldErrors({})
    setIsFormOpen(true)
  }, [])

  const closeForm = useCallback(() => {
    clearPendingCreate()
    setIsFormOpen(false)
  }, [])

  useOpenCreateFromNavigation('products', openCreate)

  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          product.sku.toLowerCase().includes(q),
      )
    }

    if (stockFilter === 'in-stock') {
      result = result.filter((product) => product.quantity_in_stock > 10)
    } else if (stockFilter === 'low-stock') {
      result = result.filter(
        (product) => product.quantity_in_stock > 0 && product.quantity_in_stock < 10,
      )
    } else if (stockFilter === 'out-of-stock') {
      result = result.filter((product) => product.quantity_in_stock === 0)
    }

    result.sort((a, b) => {
      switch (sort) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'price-asc':
          return Number(a.price) - Number(b.price)
        case 'price-desc':
          return Number(b.price) - Number(a.price)
        case 'stock-asc':
          return a.quantity_in_stock - b.quantity_in_stock
        case 'stock-desc':
          return b.quantity_in_stock - a.quantity_in_stock
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
      }
    })

    return result
  }, [products, search, sort, stockFilter])

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      quantity_in_stock: String(product.quantity_in_stock),
    })
    setFieldErrors({})
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFieldErrors({})

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      quantity_in_stock: Number(form.quantity_in_stock),
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: payload.name,
          price: payload.price,
          quantity_in_stock: payload.quantity_in_stock,
        })
        success('Product updated successfully')
      } else {
        await createProduct(payload)
        success('Product added successfully')
      }
      closeForm()
      await loadProducts()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save product'
      if (message.toLowerCase().includes('sku')) {
        setFieldErrors({ sku: message })
      } else {
        toastError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteProduct(deleteTarget.id)
      success('Product deleted successfully')
      setDeleteTarget(null)
      await loadProducts()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to delete product')
    }
  }

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      width: '32%',
      render: (row) => (
        <div>
          <p className="font-medium text-white">{row.name}</p>
          <p className="font-mono text-xs text-white/40">{row.sku}</p>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      align: 'right',
      width: '14%',
      render: (row) => (
        <span className={amountCellClass}>{formatCurrency(Number(row.price))}</span>
      ),
    },
    {
      key: 'quantity_in_stock',
      header: 'Stock',
      sortable: true,
      width: '18%',
      render: (row) => (
        <Badge variant={getStockBadgeVariant(row.quantity_in_stock)}>
          {getStockLabel(row.quantity_in_stock)} ({row.quantity_in_stock})
        </Badge>
      ),
    },
    {
      key: 'updated_at',
      header: 'Last Updated',
      sortable: true,
      width: '20%',
      render: (row) => formatRelative(row.updated_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '16%',
      render: (row) => (
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => openEdit(row)}
            className="rounded-lg bg-white/5 p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Pencil className="h-4 w-4" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400 transition-colors hover:bg-rose-500/20"
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>
        </div>
      ),
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <PageHeader
        title="Products"
        subtitle="Manage your product catalog and stock levels"
        action={
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </motion.button>
        }
      />

      <div className="rounded-2xl border border-white/5 bg-[#1A1A1F] p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU..."
              className={`${inputClassName} pl-10`}
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className={selectClassName}
            style={{ backgroundColor: '#111113' }}
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="price-asc">Price Low-High</option>
            <option value="price-desc">Price High-Low</option>
            <option value="stock-asc">Stock Low-High</option>
            <option value="stock-desc">Stock High-Low</option>
            <option value="newest">Newest First</option>
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as StockFilter)}
            className={selectClassName}
            style={{ backgroundColor: '#111113' }}
          >
            <option value="all">All Stock</option>
            <option value="in-stock">In Stock (&gt;10)</option>
            <option value="low-stock">Low Stock (1-9)</option>
            <option value="out-of-stock">Out of Stock (0)</option>
          </select>
        </div>

        <p className="mt-3 text-sm text-white/50">
          Showing {filteredProducts.length} of {products.length} products
        </p>
      </div>

      <DataTable
        columns={columns}
        data={filteredProducts}
        loading={loading}
        rowKey={(row) => row.id}
        emptyMessage="No products match your filters"
        emptyDescription="Try adjusting your search or stock filter to find products."
      />

      <Sheet
        open={isFormOpen}
        onClose={closeForm}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">Product Name*</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Wireless Headphones"
              className={inputClassName}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">SKU*</span>
            <input
              required
              disabled={!!editingProduct}
              value={form.sku}
              onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
              placeholder="e.g. HEAD-WRL-01"
              className={inputClassName}
            />
            <span className="text-xs text-white/40">
              Unique identifier. Cannot be changed after creation.
            </span>
            {fieldErrors.sku && (
              <span className="text-xs text-rose-400">{fieldErrors.sku}</span>
            )}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">Price*</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">$</span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                className={`${inputClassName} pl-7`}
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">Quantity in Stock*</span>
            <input
              required
              type="number"
              min="0"
              value={form.quantity_in_stock}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, quantity_in_stock: e.target.value }))
              }
              className={inputClassName}
            />
          </label>

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={submitting}
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {editingProduct ? 'Save Changes' : 'Add Product'}
          </motion.button>
        </form>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Product"
        variant="destructive"
      />
    </motion.div>
  )
}
