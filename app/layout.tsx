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
  openGraph: {
    images: 'https://synergy-delta.vercel.app/_next/image?url=%2Fhero-desktop1.png&w=3840&q=75',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta property="og:image:alt" content="About Synergy" />
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
