"use client"
import { useState } from 'react'
import Image from "next/image"
import Link from "next/link"
import { Mail,Lock } from 'lucide-react'
import { motion } from "framer-motion";
import { signIn } from 'next-auth/react'

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 }
};
  return (
    <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
  className='min-h-[calc(100vh-75px)] bg-black text-white flex'>
        <div className='w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12'>
        <motion.div
  initial="hidden"
  animate="show"
  variants={{
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.12
      }
    }
  }} className="w-full max-w-md">
      <motion.div variants={fadeUp} className='mb-10'>
        <h1 className='text-5xl mb-3 font-cormorant-garamond'>Welcome Back</h1>
        <p className="text-white/60">Sign in to access your account</p>
      </motion.div>
      <div className='space-y-6'>
        <motion.div variants={fadeUp}>
          <label className='block text-sm uppercase tracking-wider mb-2' htmlFor="email">Email</label>
          <div className='relative'>
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
          <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" className='w-full pl-12 pr-4 py-4 border border-white/20 focus:border-white outline-none transition-colors text-white placeholder:text-white/30' placeholder='your@email.com' name="" id="" />
          </div>
        </motion.div>
          <motion.div variants={fadeUp}>
          <label className='block text-sm uppercase tracking-wider mb-2' htmlFor="email">Password</label>
          <div className='relative'>
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
          <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" className='w-full pl-12 pr-4 py-4 border border-white/20 focus:border-white outline-none transition-colors text-white placeholder:text-white/30'  placeholder='Enter your password' name="" id="" />
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className='flex items-center justify-end'>
          <Link className='text-sm text-white/70 hover:text-white transition-colors' href="/forget-password">Forgot password?</Link>
        </motion.div>
        <motion.button
  variants={fadeUp}
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.97 }} className='w-full font-bold cursor-pointer hover:scale-[102%] bg-white text-black py-4 uppercase tracking-widest hover:bg-white/90 transition-all'>Sign In</motion.button>
       <motion.div className='flex flex-col gap-6' variants={fadeUp}>

        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
                      <div className='w-full border-t border-white/10'></div>
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='px-4 bg-black text-white/40 uppercase tracking-wider'>
            Or continue with
            </span>
          </div>
        </div>
        <button onClick={()=>signIn("google")} className='py-3 border cursor-pointer border-white/20 hover:border-white transition-colors text-white text-sm uppercase tracking-wider w-full'>Google</button>
        <p className='text-center text-white/60 text-sm'>Don't have an account? <Link href="/signUp" className='text-white hover:underline' >Sign up</Link></p>
      </motion.div>
       </div>
        </motion.div>
        </div>
        <motion.div
  initial={{ opacity: 0, scale: 1.1 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.8 }} className='hidden lg:block lg:w-1/2 relative bg-black'>
        <Image src="/home.jpg" className='w-full h-full object-cover opacity-50' alt='home' fill={true} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end p-12">
            <div>
                <h2 className='font-cormorant-garamond text-6xl text-white mb-4 '>Timeless <br/> <span className='text-[#d4af37]'>Elegance</span></h2>
                <p className='text-white/80 max-w-md tracking-wide'>Curated accessories for the discerning individual</p>
            </div>
        </div>
        </motion.div>
    </motion.div>
  )
}

export default SignIn