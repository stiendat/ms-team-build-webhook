// src/app/layout.js
import './globals.css';

export const metadata = {
    title: 'MS Teams Webhook Dashboard',
    description: 'Monitor webhook messages and command executions',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <body className="min-h-screen bg-gray-50">
        <header className="bg-blue-600 text-white p-4">
            <div className="container mx-auto">
                <h1 className="text-2xl font-bold">MS Teams Webhook</h1>
            </div>
        </header>
        {children}
        <footer className="bg-gray-100 p-4 text-center text-sm text-gray-600 mt-8">
            &copy; {new Date().getFullYear()} MS Teams Webhook Dashboard
        </footer>
        </body>
        </html>
    );
}