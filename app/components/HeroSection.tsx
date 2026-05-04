"use client"
import {ChevronRight} from "lucide-react";
import { motion } from "framer-motion"

import Image from "next/image";


const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0 }
}

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
}
import React from 'react'

const HeroSection = () => {
  return (
      <section className="relative min-h-[calc(100vh-75px)] flex items-center justify-center">
          
          {/* background image */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              className="w-full h-full">
              <Image
                src="/watchHome.jpg"
                alt="Home"
                fill={true}
                className="w-full h-full object-cover"
                priority
              />
            </motion.div>
    
            {/* ✅ fix 1 — dark overlay top AND bottom so text visible everywhere */}
            <div className="absolute inset-0 bg-black/40" />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30"
            />
          </div>
    
          {/* content */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12 text-center w-full">
    
            {/* ✅ fix 2 — white text with backdrop so visible on bright image */}
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="text-sm uppercase tracking-[0.3em] text-white/70 mb-6">
              Premium Accessories
            </motion.p>
    
            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-5xl sm:text-6xl lg:text-8xl tracking-tight leading-none font-cormorant-garamond text-white">
              Timeless
            </motion.h1>
    
            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-5xl sm:text-6xl lg:text-8xl tracking-tight leading-none font-cormorant-garamond mb-6">
              <span className="text-(--primary)">Elegance</span>
            </motion.h1>
    
            {/* ✅ fix 3 — brighter text for description */}
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="text-base sm:text-lg lg:text-xl text-white/80 mb-10 max-w-2xl mx-auto tracking-wide px-4">
              Discover our curated collection of premium accessories.
            </motion.p>
    
            {/* ✅ fix 4 — mobile first buttons, stack on mobile side by side on desktop */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 px-6">
    
              {/* primary CTA */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto bg-(--primary) text-(--primary-foreground) px-8 sm:px-12 py-4 uppercase tracking-widest flex items-center justify-center gap-3 group text-sm">
                Explore Collection
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
    
              {/* secondary CTA */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto border border-white/60 text-white px-8 sm:px-12 py-4 uppercase tracking-widest text-sm hover:border-white transition-colors">
                Our Story
              </motion.button>
    
            </motion.div>
    
            {/* scroll indicator — hidden on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="hidden sm:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-white/50">Scroll</span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="w-px h-8 bg-white/50">
              </motion.div>
            </motion.div>
    
          </motion.div>
        </section>
  )
}

export default HeroSection