import React from 'react';
import { Heart, Brain, Bone, Eye, Baby, Ear } from "lucide-react";

const specialties = [
  {
    icon: Heart,
    name: "Tim mạch",
    description: "Chuyên gia đầu ngành Tim Mạch",
    image: "/images/cardiology-medical-heart.jpg",
  },
  {
    icon: Brain,
    name: "Thần kinh",
    description: "Bác sĩ chuyên khoa Thần Kinh",
    image: "/images/neurology-brain-medical.jpg",
  },
  {
    icon: Bone,
    name: "Cơ Xương Khớp",
    description: "Điều trị bệnh Cơ Xương Khớp",
    image: "/images/orthopedics-bone-medical.jpg",
  },
  {
    icon: Eye,
    name: "Mắt",
    description: "Chăm sóc sức khỏe đôi mắt",
    image: "/images/ophthalmology-eye-medical.jpg",
  },
  {
    icon: Baby,
    name: "Nhi khoa",
    description: "Chăm sóc sức khỏe trẻ em",
    image: "/images/pediatrics-children-medical.jpg",
  },
  {
    icon: Ear,
    name: "Tai Mũi Họng",
    description: "Chuyên khoa Tai Mũi Họng",
    image: "/images/ent-ear-nose-throat-medical.jpg",
  },
];

export default function SpecialtiesSection() {
  return (
    <section id="specialties" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Chuyên khoa</h2>
            <p className="text-gray-600">Đặt lịch với bác sĩ chuyên khoa hàng đầu</p>
          </div>
          <a href="#" className="text-blue-600 font-medium hover:underline hidden md:block">
            Xem thêm →
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialties.map((specialty, index) => {
            const Icon = specialty.icon;
            return (
              <a
                key={index}
                href="#"
                className="group relative overflow-hidden rounded-xl border bg-white transition-all hover:shadow-lg hover:border-blue-500/50"
              >
                <div className="aspect-video overflow-hidden bg-gray-100">
                  <img
                    src={specialty.image}
                    alt={specialty.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/400x225?text=" + specialty.name;
                    }}
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900">{specialty.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{specialty.description}</p>
                </div>
              </a>
            );
          })}
        </div>

        <div className="text-center mt-8 md:hidden">
          <a href="#" className="text-blue-600 font-medium hover:underline">
            Xem thêm →
          </a>
        </div>
      </div>
    </section>
  );
}
