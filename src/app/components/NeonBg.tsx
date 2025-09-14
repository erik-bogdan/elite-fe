"use client";

import Image from "next/image";

export default function NeonBg() {
  return (
    <div className="fixed inset-0 -z-10 w-screen h-screen overflow-hidden bg-[#002b6b]">
      <Image
        src="/bg.png"
        alt="Beerpong neon background"
        fill
        sizes="100vw"
        priority
        className="object-cover blur-[12px] scale-110 will-change-transform"
      />
      <div className="absolute inset-0 bg-[#002b6b]/20" />
    </div>
  );
} 