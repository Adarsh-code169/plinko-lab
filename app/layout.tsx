import type { Metadata } from 'next';
import { Outfit, Roboto_Mono } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit'
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono'
});

export const metadata: Metadata = {
  title: 'Pond of Plinko | Provably Fair Game',
  description: 'A deterministic, provably fair Plinko casino game.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${robotoMono.variable} bg-teal-950 text-slate-100 min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
