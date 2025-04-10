// src/components/MessageHistory.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MessageHistory() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await fetch('/api/messages');
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
            router.push(`/command/${message.id}`);
        }
    };

    if (loading) return <div className="text-center p-4">Loading message history...</div>;
    if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

    return (
        <div className="w-full">
            <h2 className="text-xl font-bold mb-4">Webhook Message History</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2 border">ID</th>
                        <th className="p-2 border">Sender</th>
                        <th className="p-2 border">Timestamp</th>
                        <th className="p-2 border">Content</th>
                        <th className="p-2 border">Command</th>
                        <th className="p-2 border">Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {messages.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="text-center p-4">No messages found</td>
                        </tr>
                    ) : (
                        messages.map(msg => (
                            <tr
                                key={msg.id}
                                className={`border-b hover:bg-gray-50 ${msg.command_status ? 'cursor-pointer' : ''}`}
                                onClick={() => msg.command_status && handleRowClick(msg)}
                                title={msg.command_status ? "Click to view command details" : ""}
                            >
                                <td className="p-2 border">{msg.id}</td>
                                <td className="p-2 border">{msg.sender}</td>
                                <td className="p-2 border">{new Date(msg.timestamp).toLocaleString()}</td>
                                <td className="p-2 border">{msg.content}</td>
                                <td className="p-2 border">{msg.command || 'N/A'}</td>
                                <td className={`p-2 border ${
                                    msg.command_status === 'SUCCESS' ? 'text-green-600' :
                                        msg.command_status === 'FAILED' ? 'text-red-600' :
                                            msg.command_status === 'START' ? 'text-blue-600' : ''
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