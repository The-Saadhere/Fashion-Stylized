"use client"
import {ChevronRight} from "lucide-react";
import { motion } from "framer-motion"
import Link from "next/link";
import { Image } from '@imagekit/next'

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


const HeroSection = () => {
  return (
      <section className="relative min-h-[calc(100svh-115px)] flex md:items-center items-end md:pb-25 pb-15 md:justify-items-start justify-center">
          
          {/* background image */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              className="w-full h-full">
              <Image
                                  urlEndpoint='https://ik.imagekit.io/fashionstylized'
                                  alt='Wallet'
                                  fill={true}
                                  className='w-full hidden md:block h-full object-cover '
                                  src="main-hero"
                                />
                                {/* mobile */}
                                 <Image
                                  urlEndpoint='https://ik.imagekit.io/fashionstylized'
                                  alt='Wallet'
                                  fill={true}
                                  className='w-full block md:hidden h-full object-cover '
                                  src="mobile.png"
                                />
            </motion.div>
    
            {/* ✅ fix 1 — dark overlay top AND bottom so text visible everywhere */}
            {/* <div className="absolute inset-0 bg-black/40" /> */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2 }}
              className="absolute block md:hidden inset-0 bg-gradient-to-t from-background via-background/50 to-background/30"
            />
          </div>
    
          {/* content */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12  w-full">
    
            {/* ✅ fix 2 — white text with backdrop so visible on bright image */}
           {/* <motion.p
  variants={fadeUp}
  transition={{ duration: 0.7, ease: "easeOut" }}
  className="text-sm uppercase tracking-[0.3em] text-white/70 mb-6"
>
  Premium Wallets & Glasses
</motion.p> */}

<motion.h1
  variants={fadeUp}
  transition={{ duration: 0.8, ease: "easeOut" }}
  className="text-4xl sm:text-5xl  md:text-start text-center tracking-tight uppercase leading-none font-cormorant-garamond text-white"
>
  Luxury Accessories
</motion.h1>

<motion.h2
  variants={fadeUp}
  transition={{ duration: 0.8, ease: "easeOut" }}
  className="text-4xl sm:text-5xl  md:text-start text-center uppercase  tracking-tight leading-none font-cormorant-garamond mb-3 md:mb-6"
>
  <span className="text-(--primary)">Designed To Last</span>
</motion.h2>

 <div className="flex items-center xl:w-[550px] lg:w-[450px] md:w-[350px] w-full mt-2 md:mt-0">
      <div className="flex-1 border-t border-[#d4af37]" />
      <span className="px-4 text-[#d4af37] text-xl">
        ✦
      </span>
      <div className="flex-1 border-t border-[#d4af37]" />
    </div>

<motion.p
  variants={fadeUp}
  transition={{ duration: 0.7, ease: "easeOut" }}
  className="text-base sm:text-lg md:text-start text-center text-white/80 mb-6 md:mb-10 max-w-[470px] mt-3 md:mt-5 tracking-wide px-4"
>
  Discover premium glasses designed for quality,
  comfort, and everyday confidence.
</motion.p>
    
            {/* ✅ fix 4 — mobile first buttons, stack on mobile side by side on desktop */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="flex flex-col sm:flex-row md:items-start items-center gap-2 sm:gap-3 px-6">
    
              {/* primary CTA */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto bg-(--primary) text-(--primary-foreground) min-[380px]:px-4 px-2 px-0 sm:px-12 py-4 uppercase tracking-widest flex items-center justify-center md:gap-3 gap-2 group text-sm">
                  <Link href="/products/collections">
                  
                Explore Collection
                  </Link>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
    
              {/* secondary CTA */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto border border-white/60 text-white px-8 sm:px-12 py-4 uppercase tracking-widest text-sm hover:border-white transition-colors">
                <Link href="/products">
                
                Shop Now
                </Link>
              </motion.button>
    
            </motion.div>
    
            {/* scroll indicator — hidden on mobile */}
            {/* <motion.div
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
            </motion.div> */}
    
          </motion.div>
        </section>
  )
}

export default HeroSection