// components/layout/TopBanner.tsx
"use client"
import { motion } from "framer-motion"
import { Truck, RefreshCw, Shield, Phone } from "lucide-react"

const messages = [
  { icon: Shield, text: "11.11 SALE - UP TO 15% OFF" },
  { icon: Truck, text: "delivery all over Pakistan" },
  { icon: RefreshCw, text: "7 day hassle-free return policy" },
  { icon: Shield, text: "100% authentic premium products" },
  { icon: Phone, text: "Contact us on WhatsApp: 0318 2942654" },
  { icon: Shield, text: "Cash on delivery available" },
  { icon: Shield, text: "11.11 SALE - UP TO 15% OFF" },
  { icon: Truck, text: "delivery all over Pakistan" },
  { icon: RefreshCw, text: "7 day hassle-free return policy" },
  { icon: Shield, text: "100% authentic premium products" },
  { icon: Phone, text: "Contact us on WhatsApp: 0318 2942654" },
  { icon: Shield, text: "Cash on delivery available" },
]

const TopBanner = () => {
  return (
    <div className="bg-(--primary) text-(--primary-foreground) py-2 overflow-hidden relative">
      {/* ✅ fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-(--primary) to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-(--primary) to-transparent z-10 pointer-events-none" />

      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop"
        }}
        className="flex items-center gap-12 whitespace-nowrap w-max">
        {messages.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-xs uppercase tracking-widest font-medium">
              {item.text}
            </span>
            {/* dot separator */}
            <span className="text-(--primary-foreground)/50 ml-8">•</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

export default TopBanner