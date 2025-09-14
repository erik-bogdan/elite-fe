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
            <div className=" before:content-[''] before:absolute before:top-0 before:left-[-20px] before:bottom-0 before:py-[5px] before:w-[10px] before:block before:z-[10] before:bg-[#ec6734]">
                <div className={`text-7xl ${bebasNeue.className}`}>{title}</div>
                {subtitle && <div className={`text-lg ${openSans.className}`}>{subtitle}</div>}
            </div>
        </div>

    );
}
