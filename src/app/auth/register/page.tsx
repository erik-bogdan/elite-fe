"use client";
import React from "react";
import { FaUserPlus } from "react-icons/fa";
import { RegisterForm } from "@/components/features/auth/RegisterForm";
import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

export default function RegisterPage() {
  return (
    <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border-2 border-[#ff5c1a] shadow-xl shadow-[#ff5c1a33]">
      <div className="flex items-center gap-4 mb-8 justify-center">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#ff5c1a] to-[#002b6b] flex items-center justify-center shadow-lg shadow-[#ff5c1a]/40">
          <FaUserPlus className="w-8 h-8 text-white" />
        </div>
        <h1 className={`${bebasNeue.className} text-3xl sm:text-4xl tracking-wider text-white`}>
          REGISZTRÁCIÓ
        </h1>
      </div>
      <RegisterForm />
    </div>
  );
}
