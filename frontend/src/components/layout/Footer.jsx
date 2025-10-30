import React from "react";
import { Facebook, Instagram, Twitter, Youtube, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer id="contact" className="border-t bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden bg-white p-1">
                <img 
                  src="/images/logo.png" 
                  alt="ClinicBooking Logo" 
                  className="h-full w-full object-cover rounded-lg"
                  onError={(e) => {
                    // Fallback to original design if logo fails to load
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `
                      <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0d6efd]">
                        <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                      </div>
                    `;
                  }}
                />
              </div>
              <span className="text-xl font-semibold text-[#0d6efd]">ClinicBooking</span>
            </div>
            <p className="text-sm text-muted-foreground text-pretty">
              Hệ thống đặt lịch khám bệnh trực tuyến hàng đầu Việt Nam. Kết nối bạn với các bác sĩ chuyên khoa uy tín.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Liên kết nhanh</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#home" className="text-muted-foreground hover:text-primary transition-colors">
                  Trang chủ
                </a>
              </li>
              <li>
                <a href="#doctors" className="text-muted-foreground hover:text-primary transition-colors">
                  Bác sĩ
                </a>
              </li>
              <li>
                <a href="#booking" className="text-muted-foreground hover:text-primary transition-colors">
                  Đặt lịch
                </a>
              </li>
              <li>
                <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Liên hệ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Thông tin liên hệ</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-[#0d6efd] mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">1900 1234</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-[#0d6efd] mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">tungdtde180564@fpt.edu.vn</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#0d6efd] mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Trường đại học FPT University Da Nang</span>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Kết nối với chúng tôi</h3>
            <div className="flex gap-3">
              <a href="https://www.facebook.com" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f8ff] text-[#0d6efd] hover:bg-[#0d6efd] hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f8ff] text-[#0d6efd] hover:bg-[#0d6efd] hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f8ff] text-[#0d6efd] hover:bg-[#0d6efd] hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://www.youtube.com" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f8ff] text-[#0d6efd] hover:bg-[#0d6efd] hover:text-white transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Giờ làm việc: 8:00 - 20:00 (Thứ 2 - Chủ nhật)</p>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-gray-500">
          <p>© 2025 ClinicBooking. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}
