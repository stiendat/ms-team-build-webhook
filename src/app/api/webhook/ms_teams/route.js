// src/app/api/webhook/ms_teams/route.js
import { NextResponse } from 'next/server';
import dbManager from '@/lib/db';
import commandExecutor from "@/lib/commandExecutor";
import {validateTeamsWebhook} from "@/lib/webhookValidator";

export async function POST(request) {
    let messageId;

    try {
        // Get the raw request body for HMAC validation
        const rawBody = await request.text();

        // Get the Authorization header
        const authHeader = request.headers.get('Authorization');

        // Validate the webhook request
        const validationResult = validateTeamsWebhook(
            authHeader,
            rawBody,
            process.env.HMAC_SECRET
        );

        if (!validationResult.isValid) {
            console.warn('Invalid webhook signature:', validationResult.errorMessage);

            // Create an unauthorized adaptive card response
            const unauthorizedCard = {
                type: "AdaptiveCard",
                version: "1.5",
                body: [
                    {
                        type: "TextBlock",
                        text: "Authentication Error",
                        weight: "Bolder",
                        size: "Medium",
                        color: "Attention"
                    },
                    {
                        type: "TextBlock",
                        text: `Invalid webhook signature`,
                        wrap: true
                    }
                ],
                $schema: "http://adaptivecards.io/schemas/adaptive-card.json"
            };

            // Return adaptive card with 401 status
            return NextResponse.json({
                type: "message",
                attachments: [
                    {
                        contentType: "application/vnd.microsoft.card.adaptive",
                        content: unauthorizedCard
                    }
                ]
            }, { status: 200 });
        }

        // Log the validation result
        console.log('Webhook signature validated successfully.');

        // Parse the incoming webhook data
        const payload = JSON.parse(rawBody);

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

        let commandExecutionResult;
        // Execute a build command
        commandExecutionResult = await commandExecutor.executeCommand(
            messageId,
            process.env.BUILD_COMMAND || 'echo "No build command specified"'
        );

        // Create an adaptive card response
        const adaptiveCard = {
            type: "AdaptiveCard",
            version: "1.5",
            body: [
                {
                    type: "TextBlock",
                    text: "Build Request Processed",
                    weight: "Bolder",
                    size: "Medium"
                },
                {
                    type: "FactSet",
                    facts: [
                        { title: "Sender", value: senderName },
                        { title: "Time", value: timestamp },
                        { title: "Build ID", value: messageId.toString() },
                        { title: "Status", value: commandExecutionResult?.status || "UNKNOWN" }
                    ]
                }
            ],
            actions: [
                {
                    type: "Action.OpenUrl",
                    title: "View Details",
                    url: `${process.env.BASE_URL || 'http://localhost:3000'}/command/${messageId}`
                }
            ],
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json"
        };

        // Return adaptive card response in the format Teams expects
        return NextResponse.json({
            type: "message",
            attachments: [
                {
                    contentType: "application/vnd.microsoft.card.adaptive",
                    content: adaptiveCard
                }
            ]
        }, {
            status: 200
        });

    } catch (error) {
        console.error('Error processing Teams webhook:', error);
        // Create an error adaptive card
        const errorAdaptiveCard = {
            type: "AdaptiveCard",
            version: "1.5",
            body: [
                {
                    type: "TextBlock",
                    text: "Error Processing Build Request",
                    weight: "Bolder",
                    size: "Medium",
                    color: "Attention"
                },
                {
                    type: "TextBlock",
                    text: `Failed to process webhook: ${error.message}`,
                    wrap: true
                }
            ],
            actions: messageId ? [
                {
                    type: "Action.OpenUrl",
                    title: "View Details",
                    url: `${process.env.BASE_URL || 'http://localhost:3000'}/command/${messageId}`
                }
            ] : [],
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json"
        };

        return NextResponse.json({
            type: "message",
            attachments: [
                {
                    contentType: "application/vnd.microsoft.card.adaptive",
                    content: errorAdaptiveCard
                }
            ]
        }, {
            status: 200
        });
    }
}