// frontend/src/pages/OrderDetailPage.tsx

import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/hooks/useToast'
import { deleteOrder, getOrder } from '@/lib/api'
import {
  amountCellClass,
  formatCurrency,
  formatDate,
  formatId,
  getAvatarColor,
  getInitials,
  idCellClass,
} from '@/lib/format'
import type { Order } from '@/types'

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      setNotFound(false)
      try {
        const data = await getOrder(id)
        setOrder(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load order'
        if (message.toLowerCase().includes('not found')) {
          setNotFound(true)
        } else {
          toastError(message)
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id, toastError])

  const handleDelete = async () => {
    if (!order) return
    setDeleting(true)
    try {
      await deleteOrder(order.id)
      success('Order deleted and stock restored')
      navigate('/orders')
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to delete order')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-white/5" />
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="h-80 animate-pulse rounded-2xl bg-[#1A1A1F] lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl bg-[#1A1A1F] lg:col-span-3" />
        </div>
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <EmptyState
        icon={ArrowLeft}
        title="Order not found"
        description="This order may have been deleted or the link is invalid."
        action={
          <Link
            to="/orders"
            className="inline-flex rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
          >
            Back to Orders
          </Link>
        }
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <Link
        to="/orders"
        className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="rounded-2xl border border-white/5 bg-[#1A1A1F] p-6"
          >
            <h3 className="mb-4 text-sm font-medium uppercase tracking-widest text-white/40">
              Customer
            </h3>
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold ${getAvatarColor(order.customer.full_name)}`}
              >
                {getInitials(order.customer.full_name)}
              </div>
              <div>
                <p className="font-semibold text-white">{order.customer.full_name}</p>
                <p className="text-sm text-white/50">{order.customer.email}</p>
                <p className="text-sm text-white/50">{order.customer.phone_number}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="rounded-2xl border border-white/5 bg-[#1A1A1F] p-6"
          >
            <h3 className="mb-4 text-sm font-medium uppercase tracking-widest text-white/40">
              Order Metadata
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-white/40">Order ID</p>
                <p className={idCellClass}>{formatId(order.id)}</p>
              </div>
              <div>
                <p className="text-white/40">Date</p>
                <p className="text-white/80">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-white/40">Status</p>
                <Badge variant="success">Completed</Badge>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="rounded-2xl border border-white/5 bg-[#1A1A1F] p-6 lg:col-span-3"
        >
          <h3 className="mb-4 text-lg font-semibold text-white">Order Items</h3>

          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <thead>
                <tr className="border-b border-white/5 bg-[#141418] text-left text-xs uppercase tracking-widest text-white/40">
                  <th className="w-[40%] px-3 py-3">Product</th>
                  <th className="w-[20%] px-3 py-3 text-right">Unit Price</th>
                  <th className="w-[15%] px-3 py-3 text-right">Qty</th>
                  <th className="w-[25%] px-3 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-3 py-4">
                      <p className="font-medium text-white">{item.product_name}</p>
                      <p className="font-mono text-xs text-white/40">{item.sku}</p>
                    </td>
                    <td className={`px-3 py-4 text-right ${amountCellClass}`}>
                      {formatCurrency(item.price_at_order)}
                    </td>
                    <td className="px-3 py-4 text-right font-mono tabular-nums text-white/80">
                      {item.quantity}
                    </td>
                    <td className={`px-3 py-4 text-right ${amountCellClass}`}>
                      {formatCurrency(item.subtotal)}
                    </td>
                  </motion.tr>
                ))}
                <tr className="border-t border-white/10">
                  <td colSpan={3} className="px-3 py-5 text-right text-sm text-white/50">
                    Total Amount
                  </td>
                  <td className={`px-3 py-5 text-right text-xl font-bold ${amountCellClass} text-indigo-400`}>
                    {formatCurrency(order.total_amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/20 disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete Order
          </motion.button>
        </motion.div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Order"
        description="Deleting this order will restore stock for all products in this order."
        confirmLabel="Delete Order"
        variant="destructive"
      />
    </motion.div>
  )
}
