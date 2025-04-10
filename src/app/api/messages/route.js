// src/app/api/messages/route.js
import { NextResponse } from 'next/server';
import dbManager from '@/lib/db';

export async function GET() {
    try {
        const messages = await dbManager.execute(db => {
            const stmt = db.prepare(`
        SELECT 
          m.id, 
          m.sender, 
          m.timestamp, 
          m.content, 
          c.status as command_status,
          c.start_time,
          c.end_time,
          c.output,
          c.error
        FROM messages m
        LEFT JOIN command_executions c ON m.id = c.message_id
        ORDER BY m.created_at DESC
        LIMIT 50
      `);

            return stmt.all();
        });

        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}