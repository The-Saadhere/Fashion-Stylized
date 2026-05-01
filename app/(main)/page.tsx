"use client"
import { signOut } from "next-auth/react";
import {ChevronRight} from "lucide-react";
import { motion } from "framer-motion"
import HeroSection from "../components/HeroSection";

import Image from "next/image";
import CategorySection from "../components/CategorySection";
import NewArrival from "../components/NewArrival";



export default function Home() {
  return (
 <>
<HeroSection />
<CategorySection />
<NewArrival />
 </>
  );
}
