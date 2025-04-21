"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, MessageCircle, BookOpen, User, HeartPulse } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/context/auth-context"
import { BeamsBackground } from "@/components/beams-background"
import { motion } from "framer-motion"

export default function Home() {
  const { user } = useAuth()

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen w-full relative">
      <BeamsBackground />

      <div className="relative z-10 w-full">
        <header className="max-w-[1400px] mx-auto py-6 px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-8 w-8 text-cyan-400" />
            <span className="text-2xl font-bold text-white">DiaX</span>
          </div>
          <div className="flex gap-4 items-center">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </header>

        <main className="max-w-[1400px] mx-auto py-12 px-4">
          <div className="flex flex-col items-center text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8 p-4 rounded-full bg-cyan-500/20 text-cyan-400"
            >
              <HeartPulse className="h-16 w-16" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold mb-6 text-white"
            >
              Your Personal Diabetes Management Assistant
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-xl text-slate-300 max-w-3xl mb-8"
            >
              DiaX helps you manage your diabetes with personalized advice, resources, and a smart chatbot that
              understands your specific needs.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {user ? (
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 rounded-full px-8 py-6 text-lg"
                  >
                    Go to Dashboard <ArrowRight size={16} />
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 rounded-full px-8 py-6 text-lg"
                  >
                    Get Started <ArrowRight size={16} />
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>

          <motion.div variants={container} initial="hidden" animate="show" className="grid md:grid-cols-3 gap-8 mb-16">
            <motion.div
              variants={item}
              className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/20 transition-all hover:shadow-xl hover:border-cyan-500/20"
            >
              <div className="bg-gradient-to-br from-cyan-500 to-teal-500 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Smart Chatbot</h3>
              <p className="text-slate-300">
                Our AI-powered chatbot provides evidence-based information about diabetes management, nutrition,
                medications, and more.
              </p>
            </motion.div>

            <motion.div
              variants={item}
              className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/20 transition-all hover:shadow-xl hover:border-cyan-500/20"
            >
              <div className="bg-gradient-to-br from-cyan-500 to-teal-500 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Curated Resources</h3>
              <p className="text-slate-300">
                Browse our collection of articles, guides, and resources from trusted sources to help you better
                understand and manage your condition.
              </p>
            </motion.div>

            <motion.div
              variants={item}
              className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/20 transition-all hover:shadow-xl hover:border-cyan-500/20"
            >
              <div className="bg-gradient-to-br from-cyan-500 to-teal-500 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <User className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Personalized Experience</h3>
              <p className="text-slate-300">
                Create your medical profile to receive personalized advice and recommendations based on your diabetes
                type, medications, and health goals.
              </p>
            </motion.div>
          </motion.div>

          <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-3xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to take control of your diabetes?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of users who are managing their diabetes more effectively with DiaX.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-cyan-600 hover:bg-slate-100 rounded-full">
                  Create Account
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-cyan-600 rounded-full">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </main>

        <footer className="bg-slate-900/50 py-12 border-t border-white/10 w-full">
          <div className="max-w-[1400px] mx-auto px-4">
            <div className="flex items-center justify-center mb-6">
              <HeartPulse className="h-8 w-8 text-cyan-400 mr-2" />
              <span className="text-2xl font-bold text-cyan-400">DiaX</span>
            </div>
            <div className="text-center text-slate-400">
              <p className="mb-4">© {new Date().getFullYear()} DiaX. All rights reserved.</p>
              <div className="flex flex-wrap justify-center gap-6">
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
