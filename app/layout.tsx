import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nature Image Generator',
  description: 'Generate beautiful nature scenes procedurally in your browser.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
