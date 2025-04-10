// src/app/layout.js
import './globals.css';
import Link from 'next/link';

export const metadata = {
    title: 'MS Teams Build Dashboard',
    description: 'Monitor build triggers and command executions',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <body className="min-h-screen bg-slate-50" style={{ backgroundColor: "aliceblue" }}>
        <header className="bg-purple-700 text-white p-4 shadow-md">
            <div className="container mx-auto">
                <Link href="/" className="hover:opacity-80 inline-block">
                    <h1 className="text-2xl font-bold cursor-pointer">Dev Build Dashboard</h1>
                </Link>
            </div>
        </header>
        {children}
        </body>
        </html>
    );
}