'use client';

import Image from 'next/image';
import Link from 'next/link';
import SignOutButton from './SignOutButton';

const Navbar = () => {
  return (
    <header className="fixed top-0 left-0 w-full bg-white bg-opacity-90 backdrop-blur-md z-50 border-b border-gray-200">
      <nav className="flex justify-between items-center px-5 md:px-20 py-4 max-w-[1440px] mx-auto">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.5 26.5C20.4036 26.5 26 20.9036 26 14C26 7.09644 20.4036 1.5 13.5 1.5C6.59644 1.5 1 7.09644 1 14C1 20.9036 6.59644 26.5 13.5 26.5Z" stroke="#FF7559" strokeWidth="2"/>
            <path d="M8 14L12 18L20 10" stroke="#FF7559" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="font-bold text-xl font-['Space_Grotesk']">Price<span className="text-[#FF7559]">Wise</span></div>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/products" className="text-gray-700 hover:text-[#FF7559] transition">
            My Products
          </Link>
          <button className="text-gray-700 hover:text-[#FF7559] transition">
            Settings
          </button>
          <SignOutButton />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;