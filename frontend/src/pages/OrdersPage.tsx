// frontend/src/pages/OrdersPage.tsx

import { AnimatePresence, motion } from 'framer-motion'
import { Eye, Loader2, Plus, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { Sheet } from '@/components/ui/Sheet'
import { useOpenCreateFromNavigation } from '@/hooks/useOpenCreateFromNavigation'
import { useToast } from '@/hooks/useToast'
import { clearPendingCreate } from '@/lib/openCreate'
import {
  createOrder,
  deleteOrder,
  getCustomers,
  getOrders,
  getProducts,
} from '@/lib/api'
import { inputClassName } from '@/lib/form'
import {
  amountCellClass,
  formatCurrency,
  formatId,
  formatRelative,
  getAvatarColor,
  getInitials,
  idCellClass,
} from '@/lib/format'
import type { Customer, OrderSummary, Product } from '@/types'

interface OrderItemRow {
  id: string
  product_id: string
  quantity: number
}

function createItemRow(): OrderItemRow {
  return {
    id: crypto.randomUUID(),
    product_id: '',
    quantity: 1,
  }
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()

  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState<OrderItemRow[]>([createItemRow()])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<OrderSummary | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [ordersData, customersData, productsData] = await Promise.all([
        getOrders(),
        getCustomers(),
        getProducts(),
      ])
      setOrders(ordersData)
      setCustomers(customersData)
      setProducts(productsData)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [toastError])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openCreate = useCallback(() => {
    setItems([createItemRow()])
    setSubmitError('')
    setHighlightedItemId(null)
    setIsFormOpen(true)
  }, [])

  const closeForm = useCallback(() => {
    clearPendingCreate()
    setIsFormOpen(false)
  }, [])

  useOpenCreateFromNavigation('orders', openCreate)

  useEffect(() => {
    if (isFormOpen && customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id)
    }
  }, [isFormOpen, customers, customerId])

  const customerOptions = useMemo(
    () =>
      customers.map((customer) => ({
        value: customer.id,
        label: customer.full_name,
        description: customer.email,
      })),
    [customers],
  )

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product.id,
        label: product.name,
        description: product.sku,
        meta: `stock: ${product.quantity_in_stock}`,
      })),
    [products],
  )

  const selectedCustomer = customers.find((customer) => customer.id === customerId)

  const orderTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.product_id)
      if (!product) return sum
      return sum + Number(product.price) * item.quantity
    }, 0)
  }, [items, products])

  const updateItem = (id: string, patch: Partial<OrderItemRow>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    setHighlightedItemId(null)

    if (!customerId) {
      setSubmitError('Please select a customer.')
      return
    }

    const validItems = items.filter((item) => item.product_id)
    if (!validItems.length) {
      setSubmitError('Please add at least one order item.')
      return
    }

    for (const item of validItems) {
      const product = products.find((p) => p.id === item.product_id)
      if (product && item.quantity > product.quantity_in_stock) {
        setHighlightedItemId(item.id)
        setSubmitError(`Only ${product.quantity_in_stock} units available for ${product.name}.`)
        return
      }
    }

    setSubmitting(true)
    try {
      const created = await createOrder({
        customer_id: customerId,
        items: validItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      })
      success('Order created')
      clearPendingCreate()
      setIsFormOpen(false)
      await loadData()
      navigate(`/orders/${created.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create order'
      setSubmitError(message)

      const matchedItem = items.find((item) => {
        const product = products.find((p) => p.id === item.product_id)
        return product && message.toLowerCase().includes(product.name.toLowerCase())
      })
      if (matchedItem) setHighlightedItemId(matchedItem.id)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteOrder(deleteTarget.id)
      success('Order deleted and stock restored')
      setDeleteTarget(null)
      await loadData()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to delete order')
    }
  }

  const columns: DataTableColumn<OrderSummary>[] = [
    {
      key: 'id',
      header: 'Order ID',
      width: '12%',
      render: (row) => <span className={idCellClass}>{formatId(row.id)}</span>,
    },
    {
      key: 'customer_name',
      header: 'Customer',
      sortable: true,
      width: '28%',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${getAvatarColor(row.customer_name)}`}
          >
            {getInitials(row.customer_name)}
          </div>
          <span>{row.customer_name}</span>
        </div>
      ),
    },
    {
      key: 'items_count',
      header: 'Items',
      width: '10%',
      render: (row) => <Badge variant="info">{row.items_count}</Badge>,
    },
    {
      key: 'total_amount',
      header: 'Total Amount',
      sortable: true,
      align: 'right',
      width: '16%',
      render: (row) => (
        <span className={amountCellClass}>{formatCurrency(row.total_amount)}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      sortable: true,
      width: '18%',
      render: (row) => formatRelative(row.created_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '16%',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link to={`/orders/${row.id}`}>
            <motion.span
              whileTap={{ scale: 0.97 }}
              className="inline-flex rounded-lg bg-white/5 p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Eye className="h-4 w-4" />
            </motion.span>
          </Link>
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
        title="Orders"
        subtitle="Track and create customer orders"
        action={
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
          >
            <Plus className="h-4 w-4" />
            Create Order
          </motion.button>
        }
      />

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        rowKey={(row) => row.id}
        emptyMessage="No orders yet"
        emptyDescription="Create your first order to start tracking sales and inventory."
      />

      <Sheet
        open={isFormOpen}
        onClose={closeForm}
        title="Create Order"
        className="max-w-[600px]"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-3">
            <h4 className="text-sm font-medium text-white">Customer Selection</h4>
            <SearchableSelect
              options={customerOptions}
              value={customerId}
              onChange={setCustomerId}
              placeholder="Search customers..."
            />
            {selectedCustomer && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${getAvatarColor(selectedCustomer.full_name)}`}
                >
                  {getInitials(selectedCustomer.full_name)}
                </div>
                <span className="text-sm text-white">{selectedCustomer.full_name}</span>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white">Order Items</h4>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setItems((current) => [...current, createItemRow()])}
                className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                Add Item
              </motion.button>
            </div>

            <div className="space-y-4">
              {items.map((item) => {
                const product = products.find((p) => p.id === item.product_id)
                const subtotal = product
                  ? Number(product.price) * item.quantity
                  : 0
                const overStock =
                  product && item.quantity > product.quantity_in_stock
                const submitHighlight = highlightedItemId === item.id

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 ${
                      submitHighlight
                        ? 'border-rose-500/40 bg-rose-500/5'
                        : overStock
                          ? 'border-amber-500/40 bg-amber-500/5'
                          : 'border-white/10 bg-white/[0.03]'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-widest text-white/40">
                        Item
                      </p>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setItems((current) =>
                              current.filter((row) => row.id !== item.id),
                            )
                          }
                          className="rounded-md p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <SearchableSelect
                        options={productOptions}
                        value={item.product_id}
                        onChange={(value) => updateItem(item.id, { product_id: value })}
                        placeholder="Search products..."
                      />

                      <div className="grid gap-3 sm:grid-cols-3">
                        <label className="space-y-1">
                          <span className="text-xs text-white/50">Quantity</span>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.id, {
                                quantity: Math.max(1, Number(e.target.value) || 1),
                              })
                            }
                            className={inputClassName}
                          />
                          {overStock && product && (
                            <span className="text-xs text-amber-400">
                              Only {product.quantity_in_stock} units available
                            </span>
                          )}
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs text-white/50">Unit Price</span>
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-mono tabular-nums text-white/70">
                            {product ? formatCurrency(Number(product.price)) : '—'}
                          </div>
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs text-white/50">Subtotal</span>
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-mono tabular-nums font-medium text-white">
                            {formatCurrency(subtotal)}
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-widest text-white/40">
              Order Total
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={orderTotal}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-1 font-mono text-3xl font-bold tabular-nums text-indigo-400"
              >
                {formatCurrency(orderTotal)}
              </motion.p>
            </AnimatePresence>
          </div>

          {submitError && (
            <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {submitError}
            </p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={submitting}
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Order
          </motion.button>
        </form>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Order"
        description="Deleting this order will restore product stock levels for all items in the order."
        confirmLabel="Delete Order"
        variant="destructive"
      />
    </motion.div>
  )
}
