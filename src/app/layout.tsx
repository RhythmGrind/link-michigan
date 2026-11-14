import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Link Michigan | Michigan Industrial Microtransit Network',
  description:
    'Shift-Synchronized B2B Microtransit for Michigan Manufacturing Corridors powered by IBM watsonx.ai & Open Source OSRM.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
