// src/lib/commandExecutor.js
import { exec } from 'child_process';
import dbManager from './db';
import util from 'util';

const execPromise = util.promisify(exec);

// Command execution status enum
export const CommandStatus = {
    START: 'START',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED'
};

class CommandExecutor {
    constructor() {
        if (CommandExecutor.instance) {
            return CommandExecutor.instance;
        }

        this.queue = Promise.resolve();
        this.initializeTable();
        CommandExecutor.instance = this;
    }

    async initializeTable() {
        await dbManager.execute(db => {
            db.exec(`
        CREATE TABLE IF NOT EXISTS command_executions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          message_id INTEGER NOT NULL,
          command TEXT NOT NULL,
          status TEXT NOT NULL,
          start_time DATETIME NOT NULL,
          end_time DATETIME,
          output TEXT,
          error TEXT,
          FOREIGN KEY(message_id) REFERENCES messages(id)
        )
      `);
        });
    }

    async executeCommand(messageId, command) {
        return new Promise((resolve, reject) => {
            // Add the command execution to the queue
            this.queue = this.queue.then(async () => {
                try {
                    // Record the start of command execution
                    const startTime = new Date().toISOString();
                    await this.recordCommandExecution(messageId, command, CommandStatus.START, startTime);

                    // Execute the command
                    let result;
                    try {
                        result = await execPromise(command);

                        // Record successful execution
                        const endTime = new Date().toISOString();
                        await this.recordCommandExecution(
                            messageId,
                            command,
                            CommandStatus.SUCCESS,
                            startTime,
                            endTime,
                            result.stdout
                        );

                        resolve({
                            status: CommandStatus.SUCCESS,
                            output: result.stdout,
                            startTime,
                            endTime
                        });
                    } catch (execError) {
                        // Record failed execution
                        const endTime = new Date().toISOString();
                        await this.recordCommandExecution(
                            messageId,
                            command,
                            CommandStatus.FAILED,
                            startTime,
                            endTime,
                            null,
                            execError.message
                        );

                        resolve({
                            status: CommandStatus.FAILED,
                            error: execError.message,
                            startTime,
                            endTime
                        });
                    }

                    return result;
                } catch (error) {
                    reject(error);
                    throw error;
                }
            }).catch(err => {
                console.error('Command execution error:', err);
                reject(err);
            });
        });
    }

    async recordCommandExecution(
        messageId,
        command,
        status,
        startTime,
        endTime = null,
        output = null,
        error = null
    ) {
        return dbManager.execute(db => {
            if (status === CommandStatus.START) {
                const stmt = db.prepare(`
          INSERT INTO command_executions 
          (message_id, command, status, start_time) 
          VALUES (?, ?, ?, ?)
        `);
                return stmt.run(messageId, command, status, startTime);
            } else {
                const stmt = db.prepare(`
          UPDATE command_executions 
          SET status = ?, end_time = ?, output = ?, error = ? 
          WHERE message_id = ? AND status = 'START'
        `);
                return stmt.run(status, endTime, output, error, messageId);
            }
        });
    }
}

// Export a singleton instance
const commandExecutor = new CommandExecutor();
export default commandExecutor;