"use client";
import React from "react";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};
const MotionLink = motion(Link);
const Sidebar = ({ isOpen, onClose }: Props) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/70 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-black text-white z-50 shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
          >
            <div className="flex flex-col h-full">
              
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl tracking-wider uppercase text-white">
                  Menu
                </h2>

                <button onClick={onClose} className="p-2">
                  ✖
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-1">
                  {["Watches", "Glasses", "Wallets", "Collections", "About"].map(
                    (item, i) => (
                   <MotionLink
                   key={item}
  href="/signIn"
  initial={{ opacity: 0, x: 30 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: 0.2 + i * 0.05 }}
  className="flex items-center gap-3 py-3 px-4 text-white/70 hover:text-white hover:bg-white/10 transition"
>
  {item}
</MotionLink>
                    )
                  )}
                </div>

                {/* Account Section */}
                <div className="px-6 py-4 border-t border-white/10">
                  <h3 className="text-xs uppercase tracking-widest text-white/40 mb-4">
                    Account
                  </h3>

                  <div className="space-y-1">
                    {["My Account", "Orders", "Wishlist", "Settings"].map(
                      (item, i) => (
                       <MotionLink
                       key={item}
  href="/signIn"
  initial={{ opacity: 0, x: 30 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: 0.2 + i * 0.05 }}
  className="flex items-center gap-3 py-3 px-4 text-white/70 hover:text-white hover:bg-white/10 transition"
>
  {item}
</MotionLink>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="p-6 border-t border-white/10 space-y-3">
                <Link href="/signIn" className="block w-full py-3 text-center border border-white text-white hover:bg-white hover:text-black transition uppercase tracking-wider text-sm">
                  Sign In
                </Link>

                <Link href="/signUp" className="block w-full py-3 text-center bg-white text-black hover:bg-white/90 transition uppercase tracking-wider text-sm">
                  Sign Up
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;