"use client"
import { signOut } from "next-auth/react";
import {ChevronRight} from "lucide-react";
import { motion } from "framer-motion"
import HeroSection from "./components/HeroSection";

import Image from "next/image";



export default function Home() {
  return (
 <>
<HeroSection />
 </>
  );
}
