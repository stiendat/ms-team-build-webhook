// src/components/MessageHistory.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {formatDateUTC7} from "@/lib/dateUtils";

export default function MessageHistory() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    // Get the base path from environment or default to empty string
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await fetch(`${basePath}/api/messages`);
                if (!response.ok) {
                    throw new Error('Failed to fetch messages');
                }
                const data = await response.json();
                setMessages(data.messages);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        // Refresh data every 30 seconds
        const interval = setInterval(fetchMessages, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleRowClick = (message) => {
        if (message.command_status) {
            router.push(`${basePath}/command/${message.id}`);
        }
    };

    if (loading) return <div className="text-center p-4 text-purple-700">Loading message history...</div>;
    if (error) return <div className="text-rose-600 p-4">Error: {error}</div>;

    return (
        <div className="w-full">
            {/*<h2 className="text-xl font-bold mb-4 text-purple-800">Webhook Message History</h2>*/}
            <div className="overflow-x-auto rounded-lg shadow">
                <table className="min-w-full bg-white">
                    <thead>
                    <tr className="bg-purple-100">
                        <th className="py-3 px-4 border-b border-purple-200 text-left text-sm font-medium text-purple-800">ID</th>
                        <th className="py-3 px-4 border-b border-purple-200 text-left text-sm font-medium text-purple-800">Developer</th>
                        <th className="py-3 px-4 border-b border-purple-200 text-left text-sm font-medium text-purple-800">Timestamp</th>
                        <th className="py-3 px-4 border-b border-purple-200 text-left text-sm font-medium text-purple-800">Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {messages.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="text-center py-4 px-4 text-slate-600">No messages found</td>
                        </tr>
                    ) : (
                        messages.map(msg => (
                            <tr
                                key={msg.id}
                                className={`border-b border-slate-200 hover:bg-purple-50 ${msg.command_status ? 'cursor-pointer' : ''}`}
                                onClick={() => msg.command_status && handleRowClick(msg)}
                                title={msg.command_status ? "Click to view command details" : ""}
                            >
                                <td className="py-3 px-4 text-black">{msg.id}</td>
                                <td className="py-3 px-4 text-black">{msg.sender}</td>
                                <td className="py-3 px-4 text-black">{formatDateUTC7(msg.timestamp)}</td>
                                <td className={`py-3 px-4 ${
                                    msg.command_status === 'SUCCESS' ? 'text-emerald-600 font-medium' :
                                        msg.command_status === 'FAILED' ? 'text-rose-600 font-medium' :
                                            msg.command_status === 'START' ? 'text-amber-600 font-medium' : 'text-black'
                                }`}>
                                    {msg.command_status || 'N/A'}
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}