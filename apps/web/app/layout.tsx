import React from 'react';
import { ThemeRegistry } from '@/theme/ThemeRegistry';
import Shell from './components/Shell';

export const metadata = {
  title: 'LOGOS — Personal AI Assistant',
  description: 'Manage your digital world as naturally as a highly capable personal assistant.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0 }}>
        <ThemeRegistry>
          <Shell>{children}</Shell>
        </ThemeRegistry>
      </body>
    </html>
  );
}