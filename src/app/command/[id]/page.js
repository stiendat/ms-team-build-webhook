// src/app/command/[id]/page.js
import dbManager from '@/lib/db';
import Link from 'next/link';
import {formatDateUTC7} from "@/lib/dateUtils";

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
                <div className="bg-slate-100 p-6 rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold mb-4 text-purple-800">Command not found</h1>
                    <Link href="/" className="text-purple-600 hover:text-purple-800 hover:underline">Back to Dashboard</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="container mx-auto p-4">
            <div className="bg-slate-100 p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-4 text-purple-800">Command Execution Details</h1>
                <div className="mb-4">
                    <Link href="/" className="text-purple-600 hover:text-purple-800 hover:underline">Back to Dashboard</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="border border-slate-300 bg-white p-4 rounded">
                        <h2 className="font-bold mb-2 text-purple-700">Command Information</h2>
                        <p><span className="font-semibold text-slate-700">ID:</span> <span className="text-black">{command.id}</span></p>
                        <p><span className="font-semibold text-slate-700">Status:</span>
                            <span className={
                                command.status === 'SUCCESS' ? 'text-emerald-600 font-medium' :
                                    command.status === 'FAILED' ? 'text-rose-600 font-medium' :
                                        'text-amber-600 font-medium'
                            }>
                                {command.status}
                            </span>
                        </p>
                        <p><span className="font-semibold text-slate-700">Start Time:</span> <span className="text-black">{formatDateUTC7(command.start_time)}</span></p>
                        {command.end_time && <p><span className="font-semibold text-slate-700">End Time:</span> <span className="text-black">{formatDateUTC7(command.end_time)}</span></p>}
                        {command.end_time && <p><span className="font-semibold text-slate-700">Duration:</span> <span className="text-black">{calculateDuration(command.start_time, command.end_time)}</span></p>}
                    </div>

                    <div className="border border-slate-300 bg-white p-4 rounded">
                        <h2 className="font-bold mb-2 text-purple-700">Message Information</h2>
                        <p><span className="font-semibold text-slate-700">Message ID:</span> <span className="text-black">{command.message_id}</span></p>
                        <p><span className="font-semibold text-slate-700">Sender:</span> <span className="text-black">{command.sender}</span></p>
                    </div>
                </div>

                {command.output && (
                    <div className="mb-6">
                        <h2 className="font-bold mb-2 text-purple-700">Output</h2>
                        <pre className="bg-slate-50 border border-slate-300 p-4 rounded overflow-x-auto whitespace-pre-wrap text-black">{command.output}</pre>
                    </div>
                )}

                {command.error && (
                    <div>
                        <h2 className="font-bold mb-2 text-rose-600">Error</h2>
                        <pre className="bg-rose-50 border border-rose-200 p-4 rounded overflow-x-auto whitespace-pre-wrap text-rose-700">{command.error}</pre>
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