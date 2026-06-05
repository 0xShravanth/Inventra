// frontend/src/pages/CustomersPage.tsx

import { motion } from 'framer-motion'
import { Loader2, Plus, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Sheet } from '@/components/ui/Sheet'
import { useOpenCreateFromNavigation } from '@/hooks/useOpenCreateFromNavigation'
import { useToast } from '@/hooks/useToast'
import { clearPendingCreate } from '@/lib/openCreate'
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  getOrders,
} from '@/lib/api'
import { emailRegex, inputClassName, selectClassName } from '@/lib/form'
import { formatDate, getAvatarColor, getInitials } from '@/lib/format'
import type { Customer } from '@/types'

type SortOption = 'name-asc' | 'name-desc' | 'newest' | 'oldest'

const emptyForm = {
  full_name: '',
  email: '',
  phone_number: '',
}

export default function CustomersPage() {
  const { success, error: toastError } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [emailTouched, setEmailTouched] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)

  const emailInvalid =
    emailTouched && form.email.trim() !== '' && !emailRegex.test(form.email.trim())

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const [customersData, ordersData] = await Promise.all([
        getCustomers(),
        getOrders(),
      ])
      setCustomers(customersData)

      const counts: Record<string, number> = {}
      ordersData.forEach((order) => {
        counts[order.customer_id] = (counts[order.customer_id] || 0) + 1
      })
      setOrderCounts(counts)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [toastError])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const openCreate = useCallback(() => {
    setForm(emptyForm)
    setFieldErrors({})
    setEmailTouched(false)
    setIsFormOpen(true)
  }, [])

  const closeForm = useCallback(() => {
    clearPendingCreate()
    setIsFormOpen(false)
  }, [])

  useOpenCreateFromNavigation('customers', openCreate)

  const filteredCustomers = useMemo(() => {
    let result = [...customers]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (customer) =>
          customer.full_name.toLowerCase().includes(q) ||
          customer.email.toLowerCase().includes(q),
      )
    }

    result.sort((a, b) => {
      switch (sort) {
        case 'name-asc':
          return a.full_name.localeCompare(b.full_name)
        case 'name-desc':
          return b.full_name.localeCompare(a.full_name)
        case 'oldest':
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
      }
    })

    return result
  }, [customers, search, sort])

  const handleEmailChange = (value: string) => {
    setForm((prev) => ({ ...prev, email: value }))
    if (emailTouched || value.trim() !== '') {
      setEmailTouched(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFieldErrors({})
    setEmailTouched(true)

    if (!emailRegex.test(form.email.trim())) {
      setSubmitting(false)
      return
    }

    try {
      await createCustomer({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim() || 'N/A',
      })
      success('Customer added successfully')
      closeForm()
      setForm(emptyForm)
      setEmailTouched(false)
      await loadCustomers()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add customer'
      if (message.toLowerCase().includes('email')) {
        setFieldErrors({ email: message })
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
      await deleteCustomer(deleteTarget.id)
      success('Customer deleted successfully')
      setDeleteTarget(null)
      await loadCustomers()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to delete customer')
    }
  }

  const columns: DataTableColumn<Customer>[] = [
    {
      key: 'full_name',
      header: 'Customer',
      sortable: true,
      width: '34%',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${getAvatarColor(row.full_name)}`}
          >
            {getInitials(row.full_name)}
          </div>
          <div>
            <p className="font-medium text-white">{row.full_name}</p>
            <p className="text-xs text-white/40">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone_number',
      header: 'Phone',
      width: '18%',
      render: (row) => row.phone_number,
    },
    {
      key: 'created_at',
      header: 'Member Since',
      sortable: true,
      width: '18%',
      render: (row) => formatDate(row.created_at),
    },
    {
      key: 'orders',
      header: 'Orders Count',
      width: '14%',
      align: 'right',
      render: (row) => (
        <span className="font-mono tabular-nums">{orderCounts[row.id] ?? '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '16%',
      render: (row) => (
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => setDeleteTarget(row)}
          className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400 transition-colors hover:bg-rose-500/20"
        >
          <Trash2 className="h-4 w-4" />
        </motion.button>
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
        title="Customers"
        subtitle="View and manage registered customers"
        action={
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </motion.button>
        }
      />

      <div className="rounded-2xl border border-white/5 bg-[#1A1A1F] p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
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
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        <p className="mt-3 text-sm text-white/50">
          Showing {filteredCustomers.length} of {customers.length} customers
        </p>
      </div>

      <DataTable
        columns={columns}
        data={filteredCustomers}
        loading={loading}
        rowKey={(row) => row.id}
        emptyMessage="No customers found"
        emptyDescription="Add a customer or adjust your search to see results."
      />

      <Sheet open={isFormOpen} onClose={closeForm} title="Add Customer">
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">Full Name*</span>
            <input
              required
              value={form.full_name}
              onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
              className={inputClassName}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">Email*</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              className={inputClassName}
            />
            {emailInvalid && (
              <span className="text-xs text-rose-400">Invalid email format</span>
            )}
            {fieldErrors.email && !emailInvalid && (
              <span className="text-xs text-rose-400">{fieldErrors.email}</span>
            )}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">Phone*</span>
            <input
              required
              value={form.phone_number}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phone_number: e.target.value }))
              }
              className={inputClassName}
            />
          </label>

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={submitting || emailInvalid}
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Customer
          </motion.button>
        </form>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        description={`Delete "${deleteTarget?.full_name}"? Customers with order history cannot be removed.`}
        confirmLabel="Delete Customer"
        variant="destructive"
      />
    </motion.div>
  )
}
