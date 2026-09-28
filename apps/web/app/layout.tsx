import React from 'react';

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
      <body style={{ margin: 0, padding: 0, backgroundColor: '#fafafa' }}>
        {children}
      </body>
    </html>
  );
}