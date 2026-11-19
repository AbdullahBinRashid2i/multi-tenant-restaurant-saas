import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'Multi-Tenant Restaurant Platform',
  description: 'Dynamic Multi-Tenant Restaurant SaaS Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
