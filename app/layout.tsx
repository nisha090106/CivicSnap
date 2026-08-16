import type { Metadata } from 'next';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'CivicSnap | Smart AI Municipal Issue Reporting Platform',
  description: 'AI-powered municipal issue reporting platform connecting citizens with 7 municipal authorities.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen font-sans antialiased">
        <AccessibilityProvider>
          {children}
        </AccessibilityProvider>
      </body>
    </html>
  );
}
