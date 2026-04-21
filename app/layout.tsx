import type { Metadata } from "next";
import { Geist, Geist_Mono,Inter,Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"]

})


const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fashion Stylized - Premium Accessories for the Modern Individual",
  description: "Discover our curated collection of premium accessories, including watches, glasses, wallets, and more. Elevate your style with timeless pieces designed for the modern individual.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={` h-full antialiased bg-white  ${geistSans.variable} ${inter.variable} ${cormorantGaramond.variable} ${geistMono.variable}`}
    >
      <body  className={`min-h-full flex flex-col  ${inter.className}`}>
        <AuthProvider>

        <Navbar />
{children}
<Footer />
        </AuthProvider>
</body>
    </html>
  );
}
