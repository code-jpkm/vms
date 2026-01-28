import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });
const geistMono = Geist_Mono({ subsets: ['latin'] });

export const metadata = {
  title: 'Vendor Onboarding Portal',
  description: 'Professional vendor registration and management system',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  generator: 'v0.app'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geist.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
