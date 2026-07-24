import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dynamic Portfolio Dashboard",
  description: "Dynamic Portfolio Dashboard Foundation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <header className="bg-slate-900 text-white p-4 shadow-md">
          <div className="container mx-auto">
            <h1 className="text-xl font-bold tracking-tight">Dynamic Portfolio Dashboard</h1>
          </div>
        </header>
        
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        
        <footer className="bg-slate-100 text-slate-500 text-sm py-4 text-center border-t border-slate-200">
          <div className="container mx-auto">
            Dynamic Portfolio Dashboard &copy; {new Date().getFullYear()}
          </div>
        </footer>
      </body>
    </html>
  );
}
