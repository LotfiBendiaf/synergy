import '@/app/ui/global.css';

import { inter } from '@/app/ui/fonts';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Synergy',
    default: 'Synergy',
  },
  description: 'The official Work Management System Synergy.',
  metadataBase: new URL('https://synergy-delta.vercel.app/'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased"`}>{children}</body>
    </html>
  );
}
