"use client";
import React from "react";
import { FaUserCircle } from "react-icons/fa";
import { LoginForm } from "@/components/features/auth/LoginForm";
import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

export default function LoginPage() {
  return (
    <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border-2 border-[#ff5c1a] shadow-xl shadow-[#ff5c1a33]">
      <div className="flex items-center gap-4 mb-8 justify-center">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#ff5c1a] to-[#002b6b] flex items-center justify-center shadow-lg shadow-[#ff5c1a]/40">
          <FaUserCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className={`${bebasNeue.className} text-3xl sm:text-4xl tracking-wider text-white`}>
          BEJELENTKEZÉS
        </h1>
      </div>
      <LoginForm />
    </div>
  );
}
