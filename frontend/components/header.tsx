"use client"

import { useState } from "react"
import { Search, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">P</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">PendleTracker</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm text-foreground hover:text-primary transition">
              Home
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition">
              Explore
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition">
              Markets
            </a>
          </nav>

          {/* Desktop Auth Button */}
          <div className="hidden md:flex items-center gap-4">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Login</Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search token or pool..."
            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 space-y-3 pb-4">
            <a href="#" className="block text-sm text-foreground hover:text-primary transition">
              Home
            </a>
            <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition">
              Explore
            </a>
            <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition">
              Markets
            </a>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Login</Button>
          </nav>
        )}
      </div>
    </header>
  )
}
