import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Use Inter as planned
import "./globals.css";
import { Header } from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QC Tools - Smart Chart Generator",
  description: "Generate professional QC charts like Pareto, Fishbone, Histogram effortlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} min-h-screen flex flex-col overflow-hidden bg-white`}>
        <Header />
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </main>
      </body>
    </html>
  );
}
