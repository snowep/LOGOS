import React from 'react';
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
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0a0a0a' }}>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}