'use client';

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !(dropdownRef.current as any).contains(event.target)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-[#f5f5f5] shadow-sm border-b border-gray-300 px-6 py-4">
      <div className="flex items-center justify-between w-full">
        {/* Left Section: Logo + Nav Links (desktop) */}
        <div className="flex items-center gap-6 w-full">
          {/* Logo */}
          <Link href="/">
            <h1 className="text-xl font-extrabold tracking-wide cursor-pointer whitespace-nowrap">
              <span className="text-blue-600">SHRUTI</span>{" "}
              <span className="text-gray-800">ENTERPRISES</span>
            </h1>
          </Link>
          

          {/* Nav Links - visible on md and up */}
          <div className="hidden md:flex gap-10 -ml-[200px] text-md font-medium justify-center flex-1">
            <Link
              href="/"
              className={`${
                isActive("/")
                  ? "text-blue-600 underline underline-offset-4"
                  : "text-gray-700 hover:text-blue-600"
              } transition-colors duration-200`}
            >
              Dashboard
            </Link>
            <Link
              href="/firm"
              className={`${
                isActive("/firm")
                  ? "text-blue-600 underline underline-offset-4"
                  : "text-gray-700 hover:text-blue-600"
              } transition-colors duration-200`}
            >
              Firms
            </Link>
            <Link
              href="/staff"
              className={`${
                isActive("/staff")
                  ? "text-blue-600 underline underline-offset-4"
                  : "text-gray-700 hover:text-blue-600"
              } transition-colors duration-200`}
            >
              Staff
            </Link>
          </div>
        </div>

        {/* Right Section: Profile + Hamburger Icon */}
        <div className="flex items-center gap-4">
          {/* Profile Icon - only on md and above */}
          <div className="relative hidden md:block" ref={dropdownRef}>
            <Image
              src="/img2.png"
              width={40}
              height={40}
              alt="Profile"
              className="rounded-full border-2 border-blue-500 shadow-sm hover:scale-105 transition-transform duration-200 cursor-pointer"
              onClick={() => setShowDropdown(!showDropdown)}
            />
            {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
    <h1 className="text-sm font-semibold text-gray-800">Hi, Admin 👋</h1>
    <p className="text-xs text-gray-500">Welcome back</p>
  </div>
  <Link href="/login">
    <button
      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
      onClick={() => {
        setShowDropdown(false);
        alert("Logging out...");
      }}
    >
      Logout
    </button>
  </Link>
</div>

            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Links */}
      {isOpen && (
        <div className="md:hidden mt-4 flex flex-col gap-3 text-sm font-medium px-2">
          <Link
            href="/"
            className={`${
              isActive("/")
                ? "text-blue-600 underline underline-offset-4"
                : "text-gray-700 hover:text-blue-600"
            } transition-colors duration-200`}
            onClick={() => setIsOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/firm"
            className={`${
              isActive("/firm")
                ? "text-blue-600 underline underline-offset-4"
                : "text-gray-700 hover:text-blue-600"
            } transition-colors duration-200`}
            onClick={() => setIsOpen(false)}
          >
            Firms
          </Link>
          <Link
            href="/staff"
            className={`${
              isActive("/staff")
                ? "text-blue-600 underline underline-offset-4"
                : "text-gray-700 hover:text-blue-600"
            } transition-colors duration-200`}
            onClick={() => setIsOpen(false)}
          >
            Staff
          </Link>
          <Link href="/login">
                    <button
            className="text-left text-gray-700 hover:text-blue-600 transition-colors duration-200"
            onClick={() => {
              setIsOpen(false);
              alert("Logging out...");
              
            }}

          >
            Logout
          </button>

          
          </Link>
        </div>
      )}
    </nav>
  );
}
