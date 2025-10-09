import React, { useState } from "react";
import { Menu, X, Search, Phone, Globe, Facebook, Twitter, Instagram, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: "Trang chủ", href: "#home" },
    { label: "Cơ sở y tế", href: "#facilities" },
    { label: "Chuyên khoa", href: "#specialties" },
    { label: "Bác sĩ", href: "#doctors" },
    { label: "Đặt lịch", href: "#booking" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      {/* Top thin info bar */}
      <div className="bg-[#e9f6ff] border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-9 items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-[#034ea2]">
              <a href="tel:19002115" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="font-medium">Hotline: 1900 2115</span>
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <button className="flex items-center gap-1 text-[#6b7280] hover:text-[#034ea2]">
                <Globe className="h-4 w-4" />
                <span>VN</span>
              </button>
              <div className="flex items-center gap-2">
                <a href="https://www.facebook.com" target="_blank" rel="noreferrer" className="text-[#6b7280] hover:text-[#034ea2]">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-[#6b7280] hover:text-[#034ea2]">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="https://www.instagram.com" target="_blank" rel="noreferrer" className="text-[#6b7280] hover:text-[#034ea2]">
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6 py-4">
          {/* Logo */}
          <Link to="#home" className="flex items-center gap-3 shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0d6efd] text-white">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0d6efd]">MediCare</div>
              <div className="text-xs text-gray-500">Tìm bác sĩ, đặt lịch nhanh chóng</div>
            </div>
          </Link>

          {/* Center search - large pill */}
          <div className="flex-1">
            <div className="relative max-w-3xl mx-auto">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Tìm bác sĩ, chuyên khoa, bệnh viện..."
                className="w-full rounded-full border border-gray-200 bg-white py-3 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#cfe9ff]"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              {menuItems.map((item) => (
                <a key={item.label} href={item.href} className="text-sm font-medium text-gray-700 hover:text-[#0d6efd]">
                  {item.label}
                </a>
              ))}
            </nav>
            <Link to="/login" className="hidden md:inline-block rounded-md bg-[#0d6efd] px-4 py-2 text-white">Đăng nhập</Link>

            {/* Mobile Menu Button */}
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Open menu">
              {mobileMenuOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="search" placeholder="Tìm kiếm..." className="pl-10 bg-gray-100 w-full rounded-md py-2" />
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t py-4 space-y-3">
            {menuItems.map((item) => (
              <a key={item.label} href={item.href} className="block text-sm font-medium text-gray-700 hover:text-[#0d6efd]" onClick={() => setMobileMenuOpen(false)}>
                {item.label}
              </a>
            ))}
            <Link to="/login" className="w-full inline-block rounded-md bg-[#0d6efd] px-3 py-1 text-white text-center">Đăng nhập</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
