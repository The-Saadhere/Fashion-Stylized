import type { Metadata } from "next";
import { Geist, Geist_Mono,Inter,Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthProvider";
import { GoogleAnalytics } from '@next/third-parties/google';
import {Suspense} from "react";
import TikTokPixel from "./components/TikTokPixel";
import Script from "next/script";



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
  title: "Fashion Stylized | Premium Wallets, Watches & Glasses in Pakistan",
  description:
    "Fashion Stylized offers premium wallets, watches, and glasses in Pakistan. Explore stylish accessories for men and women, featuring modern designs, quality craftsmanship, and timeless elegance.",

  keywords: [
    "Fashion Stylized",
    "wallets in Pakistan",
    "watches in Pakistan",
    "glasses in Pakistan",
    "fashion accessories Pakistan",
    "premium accessories",
    "men accessories",
    "women accessories",
    "online shopping Pakistan",
    "stylish accessories",
  ],

  openGraph: {
    title: "Fashion Stylized | Premium Wallets, Watches & Glasses in Pakistan",
    description:
      "Shop premium wallets, watches, and glasses in Pakistan. Discover stylish accessories designed for quality, comfort, and elegance.",
    type: "website",
    locale: "en_PK",
    siteName: "Fashion Stylized",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Fashion Stylized — Premium Accessories",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Fashion Stylized | Premium Wallets, Watches & Glasses in Pakistan",
    description:
      "Explore premium wallets, watches, and glasses for men and women in Pakistan.",
    images: ["/og-image.jpg"],
  },
  metadataBase: new URL("https://fashionstylized.store"),
alternates: {
  canonical: "/",
},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={` h-full antialiased  ${geistSans.variable} ${inter.variable} ${cormorantGaramond.variable} ${geistMono.variable}`}
    >
      <body className={`min-h-full flex flex-col ${inter.className}`}>
        
         <Suspense fallback={null}>
          <TikTokPixel />
        </Suspense>
        <AuthProvider>
          <GoogleAnalytics gaId="G-4TEVQNPBXP" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Fashion Stylized",
                url: "https://fashionstylized.store",
                logo: "https://fashionstylized.store/logo.png",
                contactPoint: {
                  "@type": "ContactPoint",
                  telephone: "+92-318-2942654",
                  contactType: "customer service",
                  email: "allauddinkamaluddin@gmail.com",
                },
                sameAs: [],
              }),
            }}
          />
          {children}
        </AuthProvider>
          <Script
          id="meta-pixel"
          strategy="beforeInteractive"
        >
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');

            fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}</Script>
      </body>
    </html>
  );  
}
