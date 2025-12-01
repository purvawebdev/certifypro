import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CertifyPro — Batch Certificate Generator",
  description: "Generate certificates in batches quickly with CertifyPro",
};

export default function RootLayout({ children }) {
  const year = new Date().getFullYear();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-800`}
      >
        {/* Skip link for keyboard users */}
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-white focus:p-2 focus:rounded-md focus:shadow"
        >
          Skip to content
        </a>

        <header className="border-b bg-white/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                CP
              </div>
              <div>
                <a href="/" className="text-lg font-semibold text-gray-900">
                  CertifyPro
                </a>
                <div className="text-xs text-gray-500 -mt-0.5">
                  Batch certificate generator
                </div>
              </div>
            </div>

            <nav
              aria-label="Main navigation"
              className="hidden md:flex items-center gap-6 text-sm text-gray-600"
            >
              <a href="/" className="hover:text-gray-900">
                Home
              </a>
              <a href="#templates" className="hover:text-gray-900">
                Templates
              </a>
              <a href="#about" className="hover:text-gray-900">
                About
              </a>
              <a href="#help" className="hover:text-gray-900">
                Help
              </a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <a
                href="#"
                className="text-sm text-indigo-600 border border-indigo-600 px-3 py-1 rounded hover:bg-indigo-50"
              >
                Try demo
              </a>
            </div>
          </div>
        </header>

        <main id="content" className="min-h-[calc(100vh-160px)] flex flex-col">
          <div className="max-w-7xl mx-auto px-6 py-10 flex-1">{children}</div>
        </main>

        <footer className="border-t bg-white/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                CP
              </div>
              <div>
                <div className="font-medium text-gray-900">CertifyPro</div>
                <div className="text-xs text-gray-500">
                  Create, batch-generate and export certificates quickly.
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              © {year} CertifyPro. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
