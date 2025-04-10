// src/app/api/webhook/ms_teams/route.js
import { NextResponse } from 'next/server';
import dbManager from '@/lib/db';
import commandExecutor from "@/lib/commandExecutor";

export async function POST(request) {
    try {
        // Parse the incoming webhook data
        const payload = await request.json();

        // Extract the required information
        const senderName = payload.from?.name || 'Unknown User';
        const timestamp = payload.timestamp || 'Unknown Time';

        // Get the text content - first try direct text field, then check attachments
        let textContent = payload.text || 'No content';

        // If text contains HTML tags, try to clean it up
        if (textContent.includes('<')) {
            // Simple HTML tag removal - for more complex cases consider using a proper HTML parser
            textContent = textContent.replace(/<[^>]*>/g, '');
        }

        // Alternatively get text from attachments if available
        if (payload.attachments?.length > 0 && payload.attachments[0].contentType === 'text/html') {
            const htmlContent = payload.attachments[0].content;
            // Simple HTML tag removal for demonstration
            const plainText = htmlContent.replace(/<[^>]*>/g, '');
            if (plainText.trim()) textContent = plainText;
        }

        // Log the information (in production, consider using a proper logging system)
        console.log(`Webhook invoked by: ${senderName}`);
        console.log(`Timestamp: ${timestamp}`);
        console.log(`Message content: ${textContent}`);

        // Store or process the data as needed
        const messageResult = await dbManager.saveTeamsMessage(senderName, timestamp, textContent);
        const messageId = messageResult.lastInsertRowid;

        let commandExecutionResult = null;
        if (textContent.toLowerCase().includes('build')) {
            // Execute a build command
            commandExecutionResult = await commandExecutor.executeCommand(
                messageId,
                'whoami'
            );
        }

        // Return success response
        return NextResponse.json({
            status: 'success',
            message: 'Webhook received and processed',
            data: {
                sender: senderName,
                time: timestamp,
                content: textContent,
                commandExecuted: !!commandExecutionResult,
                commandStatus: commandExecutionResult?.status
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Error processing Teams webhook:', error);
        return NextResponse.json({
            status: 'error',
            message: 'Failed to process webhook'
        }, { status: 500 });
    }
}