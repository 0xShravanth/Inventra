// frontend/src/pages/DashboardPage.tsx

import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Download,
  Package,
  PieChart as PieChartIcon,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { StatsCard } from '@/components/ui/StatsCard'
import { useToast } from '@/hooks/useToast'
import {
  getCustomers,
  getDashboardSummary,
  getOrders,
  getProducts,
} from '@/lib/api'
import { selectClassName } from '@/lib/form'
import {
  amountCellClass,
  formatCurrency,
  formatId,
  formatRelative,
  getStockBadgeVariant,
  getStockLabel,
  idCellClass,
  truncate,
} from '@/lib/format'
import type { Customer, OrderSummary, Product } from '@/types'

type DateRange = 'today' | '7d' | '30d' | '90d' | 'all'
type StockFilter = 'all' | 'low' | 'critical' | 'healthy'
type ChartSort = 'stock-high' | 'stock-low' | 'name-asc' | 'price-high'
type ChartType = 'bar' | 'pie'

interface ChartProductPoint {
  id: string
  name: string
  fullName: string
  sku: string
  stock: number
  price: number
}

const PIE_COLORS = [
  '#6366F1',
  '#10B981',
  '#F59E0B',
  '#F43F5E',
  '#8B5CF6',
  '#06B6D4',
  '#EC4899',
  '#84CC16',
]

const DATE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  '7d': '7 Days',
  '30d': '30 Days',
  '90d': '90 Days',
  all: 'All Time',
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

const tooltipStyle = {
  backgroundColor: '#1A1A1F',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
  fontSize: 13,
}

function filterOrdersByDateRange(orders: OrderSummary[], range: DateRange) {
  if (range === 'all') return orders

  const now = new Date()
  const start = new Date()

  if (range === 'today') {
    start.setHours(0, 0, 0, 0)
  } else if (range === '7d') {
    start.setDate(now.getDate() - 7)
  } else if (range === '30d') {
    start.setDate(now.getDate() - 30)
  } else if (range === '90d') {
    start.setDate(now.getDate() - 90)
  }

  return orders.filter((order) => new Date(order.created_at) >= start)
}

function escapeCsv(value: string | number) {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export default function DashboardPage() {
  const { error: toastError, info: toastInfo } = useToast()

  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: [] as Product[],
  })
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<OrderSummary[]>([])

  const [dateRange, setDateRange] = useState<DateRange>('7d')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [chartSort, setChartSort] = useState<ChartSort>('stock-high')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [selectedProduct, setSelectedProduct] = useState<ChartProductPoint | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [dashboardData, productsData, ordersData, customersData] =
          await Promise.all([
            getDashboardSummary(),
            getProducts(),
            getOrders(),
            getCustomers(),
          ])
        setSummary(dashboardData)
        setProducts(productsData)
        setOrders(ordersData)
        setCustomers(customersData)
      } catch (err) {
        toastError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [toastError])

  const filteredChartProducts = useMemo(() => {
    let result = [...products]

    if (stockFilter === 'low') {
      result = result.filter((p) => p.quantity_in_stock < 10)
    } else if (stockFilter === 'critical') {
      result = result.filter((p) => p.quantity_in_stock < 5)
    } else if (stockFilter === 'healthy') {
      result = result.filter((p) => p.quantity_in_stock >= 10)
    }

    result.sort((a, b) => {
      switch (chartSort) {
        case 'stock-low':
          return a.quantity_in_stock - b.quantity_in_stock
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'price-high':
          return Number(b.price) - Number(a.price)
        default:
          return b.quantity_in_stock - a.quantity_in_stock
      }
    })

    return result
  }, [products, stockFilter, chartSort])

  const chartData = useMemo<ChartProductPoint[]>(
    () =>
      filteredChartProducts.slice(0, 8).map((product) => ({
        id: product.id,
        name: truncate(product.name, 12),
        fullName: product.name,
        sku: product.sku,
        stock: product.quantity_in_stock,
        price: Number(product.price),
      })),
    [filteredChartProducts],
  )

  const filteredOrders = useMemo(
    () => filterOrdersByDateRange(orders, dateRange),
    [orders, dateRange],
  )

  const recentOrders = useMemo(
    () =>
      [...filteredOrders]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 5),
    [filteredOrders],
  )

  const hasActiveFilters =
    dateRange !== '7d' || stockFilter !== 'all' || chartSort !== 'stock-high'

  const clearFilters = () => {
    setDateRange('7d')
    setStockFilter('all')
    setChartSort('stock-high')
  }

  const toggleProductSelection = (point: ChartProductPoint) => {
    setSelectedProduct((current) => (current?.id === point.id ? null : point))
  }

  const handleExport = () => {
    toastInfo('Downloading...')

    const generatedOn = new Date().toLocaleString()
    const lines: string[] = []

    lines.push('Summary')
    lines.push('Generated On,' + escapeCsv(generatedOn))
    lines.push('Date Range Filter,' + escapeCsv(DATE_LABELS[dateRange]))
    lines.push('')

    lines.push('Products')
    lines.push('ID,Name,SKU,Price,Stock')
    products.forEach((product) => {
      lines.push(
        [
          escapeCsv(product.id),
          escapeCsv(product.name),
          escapeCsv(product.sku),
          escapeCsv(product.price),
          escapeCsv(product.quantity_in_stock),
        ].join(','),
      )
    })
    lines.push('')

    lines.push('Customers')
    lines.push('ID,Full Name,Email,Phone,Created At')
    customers.forEach((customer) => {
      lines.push(
        [
          escapeCsv(customer.id),
          escapeCsv(customer.full_name),
          escapeCsv(customer.email),
          escapeCsv(customer.phone_number),
          escapeCsv(customer.created_at),
        ].join(','),
      )
    })
    lines.push('')

    lines.push('Recent Orders')
    lines.push('Order ID,Customer,Items Count,Total Amount,Date')
    filteredOrders.forEach((order) => {
      lines.push(
        [
          escapeCsv(order.id),
          escapeCsv(order.customer_name),
          escapeCsv(order.items_count),
          escapeCsv(order.total_amount),
          escapeCsv(order.created_at),
        ].join(','),
      )
    })

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const dateStamp = new Date().toISOString().slice(0, 10)
    anchor.href = url
    anchor.download = `inventory-summary-${dateStamp}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const orderColumns: DataTableColumn<OrderSummary>[] = [
    {
      key: 'id',
      header: 'Order ID',
      width: '14%',
      render: (row) => <span className={idCellClass}>{formatId(row.id)}</span>,
    },
    {
      key: 'customer_name',
      header: 'Customer',
      sortable: true,
      width: '30%',
    },
    {
      key: 'total_amount',
      header: 'Amount',
      sortable: true,
      align: 'right',
      width: '16%',
      render: (row) => (
        <span className={amountCellClass}>{formatCurrency(row.total_amount)}</span>
      ),
    },
    {
      key: 'items_count',
      header: 'Items',
      sortable: true,
      width: '12%',
      align: 'right',
      render: (row) => (
        <span className="font-mono tabular-nums">{row.items_count}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      sortable: true,
      width: '28%',
      render: (row) => formatRelative(row.created_at),
    },
  ]

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Dashboard" subtitle="Real-time inventory overview" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl border border-white/5 bg-[#1A1A1F]"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-5">
          <div className="h-80 animate-pulse rounded-2xl border border-white/5 bg-[#1A1A1F] lg:col-span-3" />
          <div className="h-80 animate-pulse rounded-2xl border border-white/5 bg-[#1A1A1F] lg:col-span-2" />
        </div>
        <div className="h-72 animate-pulse rounded-2xl border border-white/5 bg-[#1A1A1F]" />
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={item}>
        <PageHeader
          title="Dashboard"
          subtitle="Real-time inventory overview"
          action={
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/10"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </motion.button>
          }
        />
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {(['today', '7d', '30d', '90d', 'all'] as DateRange[]).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDateRange(range)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                dateRange === range
                  ? 'border-indigo-500/30 bg-indigo-500/20 text-indigo-400'
                  : 'border-white/[0.08] bg-white/5 text-white/50 hover:text-white/70'
              }`}
            >
              {DATE_LABELS[range]}
            </button>
          ))}
        </div>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as StockFilter)}
          className={`${selectClassName} w-auto rounded-full px-3 py-1.5 text-xs`}
          style={{ backgroundColor: '#111113' }}
        >
          <option value="all">All Products</option>
          <option value="low">Low Stock Only (&lt;10)</option>
          <option value="critical">Critical (&lt;5)</option>
          <option value="healthy">Healthy (≥10)</option>
        </select>

        <select
          value={chartSort}
          onChange={(e) => setChartSort(e.target.value as ChartSort)}
          className={`${selectClassName} w-auto rounded-full px-3 py-1.5 text-xs`}
          style={{ backgroundColor: '#111113' }}
        >
          <option value="stock-high">Stock (High→Low)</option>
          <option value="stock-low">Stock (Low→High)</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="price-high">Price (High→Low)</option>
        </select>

        <span className="text-xs text-white/40">
          Showing {chartData.length} of {filteredChartProducts.length} products
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-white/40 transition-colors hover:text-white/70"
          >
            Clear filters
          </button>
        )}
      </motion.div>

      <motion.div
        variants={item}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4"
      >
        <StatsCard label="Total Products" value={summary.total_products} icon={Package} color="indigo" index={0} />
        <StatsCard label="Total Customers" value={summary.total_customers} icon={Users} color="emerald" index={1} />
        <StatsCard label="Total Orders" value={summary.total_orders} icon={ShoppingCart} color="amber" index={2} />
        <StatsCard label="Low Stock Alerts" value={summary.low_stock_products.length} icon={AlertTriangle} color="rose" index={3} />
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-5">
        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="rounded-2xl border border-white/5 bg-[#1A1A1F] p-6 lg:col-span-3"
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Inventory Overview</h3>
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`rounded-full p-1.5 transition-colors ${
                  chartType === 'bar' ? 'bg-white/10 text-white' : 'text-white/30'
                }`}
              >
                <BarChart2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setChartType('pie')}
                className={`rounded-full p-1.5 transition-colors ${
                  chartType === 'pie' ? 'bg-white/10 text-white' : 'text-white/30'
                }`}
              >
                <PieChartIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-[#111113] p-6">
            <AnimatePresence mode="wait">
              {chartType === 'bar' ? (
                <motion.div
                  key="bar"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} style={{ background: 'transparent' }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                        formatter={(value) => [`${value ?? 0} in stock`, 'Stock']}
                        labelFormatter={(_, payload) =>
                          (payload?.[0]?.payload as ChartProductPoint)?.fullName ?? ''
                        }
                      />
                      <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }} />
                      <Bar
                        dataKey="stock"
                        name="Stock"
                        fill="#6366F1"
                        radius={[8, 8, 0, 0]}
                        isAnimationActive
                        style={{ background: 'transparent' }}
                        cursor="pointer"
                        onClick={(data) => {
                          const point = (data as { payload?: ChartProductPoint }).payload
                          if (point) toggleProductSelection(point)
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              ) : (
                <motion.div
                  key="pie"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart style={{ background: 'transparent' }}>
                      <Pie
                        data={chartData}
                        dataKey="stock"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        isAnimationActive
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                        onClick={(data) => {
                          const point = (data as { payload?: ChartProductPoint }).payload
                          if (point) toggleProductSelection(point)
                        }}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={entry.id}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                            style={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value, _name, props) => [
                          `${value ?? 0} in stock`,
                          (props?.payload as ChartProductPoint)?.fullName ?? '',
                        ]}
                      />
                      <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {selectedProduct && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#111113] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{selectedProduct.fullName}</p>
                    <p className="mt-1 text-sm text-white/50">SKU: {selectedProduct.sku}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="text-sm text-white/70">
                        Stock: {selectedProduct.stock}
                      </span>
                      <span className="text-sm text-white/70">
                        Price: {formatCurrency(selectedProduct.price)}
                      </span>
                      <Badge variant={getStockBadgeVariant(selectedProduct.stock)}>
                        {getStockLabel(selectedProduct.stock)}
                      </Badge>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="rounded-2xl border border-white/5 bg-[#1A1A1F] p-6 lg:col-span-2"
        >
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Low Stock</h3>
            <Badge variant="danger">Alert</Badge>
          </div>

          <div className="space-y-4">
            {summary.low_stock_products.length === 0 ? (
              <p className="text-sm text-white/50">All products are well stocked.</p>
            ) : (
              summary.low_stock_products.slice(0, 6).map((product) => {
                const width = Math.min((product.quantity_in_stock / 10) * 100, 100)
                const barColor =
                  product.quantity_in_stock < 5 ? 'bg-rose-500' : 'bg-amber-500'

                return (
                  <div key={product.id}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{product.name}</p>
                        <p className="text-xs text-white/40">{product.sku}</p>
                      </div>
                      <span className="text-xs text-white/60">
                        {product.quantity_in_stock} left
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <Link
            to="/products"
            className="mt-6 inline-flex items-center gap-1 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </motion.div>

      <motion.div variants={item}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
          >
            View All Orders
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <DataTable
            columns={orderColumns}
            data={recentOrders}
            rowKey={(row) => row.id}
            emptyMessage="No recent orders for this date range"
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
