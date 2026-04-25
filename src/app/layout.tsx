import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "استنساخ الصوت متعدد اللغات | Cross-Lingual Voice Cloning",
  description:
    "حوّل صوتك إلى أي لغة باستخدام تقنية استنساخ الصوت المتقدمة. ارفع عينة صوتية وأدخل النص للحصول على صوتك بأي لغة تختارها.",
  keywords: [
    "استنساخ الصوت",
    "تحويل الصوت",
    "تعدد اللغات",
    "Voice Cloning",
    "Cross-Lingual",
    "TTS",
  ],
  authors: [{ name: "@binnoma" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <body className={`${cairo.variable} font-[family-name:var(--font-cairo)] antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
