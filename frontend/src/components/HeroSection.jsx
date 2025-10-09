import React from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function HeroSection() {
  const benefits = [
    "Đặt khám nhanh - Lấy số thứ tự trực tuyến",
    "Đặt khám theo giờ - Đặt càng sớm đề có số thứ tự hẹn khám",
    "Được hoàn tiền khi hủy khám - Có cơ hội nhận đầy đủ tiền",
  ];

  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent-teal/10">
      <div className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="pr-6">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
              </span>
              Nền tảng công nghệ y tế hàng đầu
            </div>

            <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Kết nối Người Dân với
              <br />
              <span className="text-primary">Cơ sở & Dịch vụ Y tế</span>
            </h1>

            <p className="mb-8 text-lg text-muted-foreground max-w-xl">
              Đặt khám nhanh - Lấy số thứ tự trực tuyến - Tư vấn sức khỏe từ xa
            </p>

            {/* Value Props */}
            <div className="mb-8 space-y-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-foreground">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button className="inline-flex items-center rounded-lg bg-primary px-5 py-3 text-white text-base font-semibold shadow-md hover:bg-primary/90 transition">
                Đặt khám ngay
                <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button className="inline-flex items-center rounded-lg border border-slate-200 px-5 py-3 text-slate-700 bg-white hover:bg-slate-50 transition">
                Tìm hiểu thêm
              </button>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative rounded-2xl shadow-2xl" style={{ background: '#000', padding: '12px', borderRadius: '18px' }}>
              <div className="rounded-xl overflow-hidden bg-white">
                <img src="/images/vietnamese-doctors-medical-team-hospital-professio.jpg" alt="Medical Team" className="w-[560px] h-auto object-cover block" />
              </div>
            </div>

            {/* Floating Stats Cards */}
            <div className="absolute -bottom-4 left-4 bg-white border rounded-xl p-3 shadow-lg w-36">
              <div className="text-2xl font-bold text-primary">2.2M+</div>
              <div className="text-xs text-muted-foreground">Lượt khám</div>
            </div>
            <div className="absolute -top-6 right-0 bg-white border rounded-xl p-3 shadow-lg w-28">
              <div className="text-2xl font-bold text-primary">1000+</div>
              <div className="text-xs text-muted-foreground">Bác sĩ</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
