"use client";

import { Bebas_Neue } from "next/font/google";
import Image from "next/image";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

const bebasNeue = Bebas_Neue({
    weight: "400",
  });
  
export default function Header() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="navbar bg-neutral text-white shadow-sm sticky top-0 z-50">
            <div className="navbar-start">
                <Image
                    className="dark:invert"
                    src="/logo.svg"
                    alt="ELITE Beerpong logo"
                    width={180}
                    height={38}
                    priority
                />
            </div>

            <div className="navbar-center hidden lg:flex">
            </div>

            <div className="navbar-end">
                <ul className={`hidden lg:flex menu menu-horizontal px-1 text-3xl ${bebasNeue.className}`}>
                    <li><a>Home page</a></li>
                    <li><a>Leagues</a></li>
                    <li><a>Gallery</a></li>
                    <li><a>Shop</a></li>
                    <li><a>Contact</a></li>
                </ul>

                <button
                    className="lg:hidden p-2 text-3xl"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <FiX /> : <FiMenu />}
                </button>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 w-full bg-neutral text-white shadow-md lg:hidden">
                    <ul className={`menu menu-vertical p-4 text-xl ${bebasNeue.className}`}>
                        <li><a onClick={() => setIsOpen(false)}>Home page</a></li>
                        <li><a onClick={() => setIsOpen(false)}>Leagues</a></li>
                        <li><a onClick={() => setIsOpen(false)}>Gallery</a></li>
                        <li><a onClick={() => setIsOpen(false)}>Shop</a></li>
                        <li><a onClick={() => setIsOpen(false)}>Contact</a></li>
                    </ul>
                </div>
            )}
        </div>
    );
}
