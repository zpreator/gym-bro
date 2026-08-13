import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'Gym Bro',
  description: 'Track your lifts, together',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Gym Bro' },
};

export const viewport: Viewport = {
  themeColor: '#B8451F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="max-w-lg mx-auto min-h-screen bg-stone-100">
        <main className="pb-nav">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
