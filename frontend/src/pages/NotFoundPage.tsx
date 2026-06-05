// frontend/src/pages/NotFoundPage.tsx

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0B] px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <h1 className="bg-gradient-to-br from-indigo-400 to-purple-500 bg-clip-text text-8xl font-semibold tracking-tightest text-transparent">
          404
        </h1>
        <p className="mt-4 text-lg text-white/70">This page doesn&apos;t exist</p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
        >
          Back to Dashboard
        </Link>
      </motion.div>
    </div>
  )
}
