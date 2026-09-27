import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { cn } from "@/lib/utils"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "ProjePlano — Plan your project",
  description:
    "Organize your projects, tasks, people, and documents in one workspace.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full font-sans antialiased",
        geistSans.variable,
        geistMono.variable
      )}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
