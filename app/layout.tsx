import type {Metadata} from 'next';
import { Anuphan, Sarabun } from 'next/font/google';
import './globals.css'; // Global styles

const anuphan = Anuphan({
  subsets: ['thai', 'latin'],
  variable: '--font-anuphan',
  weight: ['300', '400', '500', '600', '700'],
});

const sarabun = Sarabun({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  variable: '--font-sarabun',
});

export const metadata: Metadata = {
  title: 'ระบบการนิเทศการสอน',
  description: 'ระบบการนิเทศการสอน โรงเรียนเฉลิมพระเกียรติสมเด็จพระศรีนครินทร์ ยะลา',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="th" className={`${anuphan.variable} ${sarabun.variable} h-full`}>
      <body className="h-full bg-slate-50 font-sans" suppressHydrationWarning>{children}</body>
    </html>
  );
}
