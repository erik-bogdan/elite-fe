"use client";

import { Bebas_Neue, Open_Sans } from "next/font/google";
import Image from "next/image";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

const bebasNeue = Bebas_Neue({
    weight: "400",
    subsets: ["latin"],
});

const openSans = Open_Sans({
    weight: "500",
    style: "italic",
    subsets: ["latin"],
});

export default function SectionTitle({ title, subtitle }: { title: string, subtitle?: string }) {

    return (
        <div className="relative">
            <div className=" before:content-[''] before:absolute before:top-0 before:left-[-10px] sm:before:left-[-15px] md:before:left-[-20px] before:bottom-0 before:py-[3px] sm:before:py-[4px] md:before:py-[5px] before:w-[6px] sm:before:w-[8px] md:before:w-[10px] before:block before:z-[10] before:bg-[#ec6734]">
                <div className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl ${bebasNeue.className}`}>{title}</div>
                {subtitle && <div className={`text-sm sm:text-base md:text-lg ${openSans.className} max-w-xs sm:max-w-sm md:max-w-lg mt-2 sm:mt-3`}>{subtitle}</div>}
            </div>
        </div>

    );
}
