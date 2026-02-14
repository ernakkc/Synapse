import { BrainService } from '../../../core/services/BrainService';
import { InterfaceLogger } from '../../../infrastructure/logging/Logger';
import { requestApprovalFromUser } from '../helpers/Approval';

async function askCommand(args: string[], logger: any) {
    const question = args.join(' ');
    if (!question) {
        logger.warn("Usage: ask [your question]");
        return;
    }

    const brainService = new BrainService();
    const response = await brainService.process({
        source: "cli",
        content: question,
        timestamp: Date.now(),
        logger: new InterfaceLogger('cli'),
        approval: requestApprovalFromUser
    });
    
    logger.success(`${response}`);
}

export { askCommand };