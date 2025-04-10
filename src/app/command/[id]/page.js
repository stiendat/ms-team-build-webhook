// src/app/command/[id]/page.js
import dbManager from '@/lib/db';
import Link from 'next/link';

export default async function CommandDetails({ params }) {
    let param = await params;
    const { id: commandId } = await param;

    const command = await dbManager.execute(db => {
        const stmt = db.prepare(`
      SELECT 
        c.*,
        m.sender,
        m.content as message_content
      FROM command_executions c
      JOIN messages m ON c.message_id = m.id
      WHERE m.id = ?
    `);

        return stmt.get(commandId);
    });

    if (!command) {
        return (
            <main className="container mx-auto p-4">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold mb-4">Command not found</h1>
                    <Link href="/" className="text-blue-600 hover:underline">Back to Dashboard</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="container mx-auto p-4">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-4">Command Execution Details</h1>
                <div className="mb-4">
                    <Link href="/" className="text-blue-600 hover:underline">Back to Dashboard</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="border p-4 rounded">
                        <h2 className="font-bold mb-2">Command Information</h2>
                        <p><span className="font-semibold">ID:</span> {command.id}</p>
                        <p><span className="font-semibold">Command:</span> {command.command}</p>
                        <p><span className="font-semibold">Status:</span>
                            <span className={
                                command.status === 'SUCCESS' ? 'text-green-600' :
                                    command.status === 'FAILED' ? 'text-red-600' :
                                        'text-blue-600'
                            }>
                {command.status}
              </span>
                        </p>
                        <p><span className="font-semibold">Start Time:</span> {new Date(command.start_time).toLocaleString()}</p>
                        {command.end_time && <p><span className="font-semibold">End Time:</span> {new Date(command.end_time).toLocaleString()}</p>}
                        {command.end_time && <p><span className="font-semibold">Duration:</span> {calculateDuration(command.start_time, command.end_time)}</p>}
                    </div>

                    <div className="border p-4 rounded">
                        <h2 className="font-bold mb-2">Message Information</h2>
                        <p><span className="font-semibold">Message ID:</span> {command.message_id}</p>
                        <p><span className="font-semibold">Sender:</span> {command.sender}</p>
                        <p><span className="font-semibold">Message:</span> {command.message_content}</p>
                    </div>
                </div>

                {command.output && (
                    <div className="mb-6">
                        <h2 className="font-bold mb-2">Output</h2>
                        <pre className="bg-gray-100 p-4 rounded overflow-x-auto whitespace-pre-wrap">{command.output}</pre>
                    </div>
                )}

                {command.error && (
                    <div>
                        <h2 className="font-bold mb-2 text-red-600">Error</h2>
                        <pre className="bg-red-50 p-4 rounded overflow-x-auto whitespace-pre-wrap text-red-700">{command.error}</pre>
                    </div>
                )}
            </div>
        </main>
    );
}

function calculateDuration(start, end) {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationMs = endTime - startTime;

    if (durationMs < 1000) {
        return `${durationMs}ms`;
    } else if (durationMs < 60000) {
        return `${(durationMs / 1000).toFixed(1)}s`;
    } else {
        const minutes = Math.floor(durationMs / 60000);
        const seconds = ((durationMs % 60000) / 1000).toFixed(1);
        return `${minutes}m ${seconds}s`;
    }
}