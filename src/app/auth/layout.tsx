import React from "react";
import Image from "next/image";
import Link from "next/link";
import NeonBg from "../components/NeonBg";
import { Bebas_Neue } from "next/font/google";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative">
      <NeonBg />
      <div className="absolute inset-0 bg-gradient-to-br from-[#002b6b] via-black to-[#002b6b] opacity-70"></div>
      
      <div className="relative z-10 w-full max-w-[300px] mb-8">
        <Link href="/">
          <Image
            src="/logo.svg"
            alt="ELITE Beerpong logo"
            width={300}
            height={300}
            className="w-full h-auto"
            priority
          />
        </Link>
      </div>
      
      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
