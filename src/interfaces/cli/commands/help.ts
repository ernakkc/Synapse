async function helpCommand(args: string[], logger: any) {
    logger.info(`
Available commands:
- ask: Ask a question to the AI and get a response.
- config: View or update configuration settings.
- system: View system information and status.
- help: Display a list of available commands and their descriptions.
- exit: Exit the CLI interface.
    `);
}

export { helpCommand };