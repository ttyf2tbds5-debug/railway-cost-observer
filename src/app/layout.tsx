import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Cost Observer · Railway spending, understood', description: 'Private Railway usage history, project budgets and explainable cost forecasts.', robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
