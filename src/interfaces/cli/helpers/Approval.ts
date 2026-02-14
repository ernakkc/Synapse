import readline from "readline";
import { Message } from "../../../core/entities/Message";
import { AnalysisResult } from "../../../core/services/analyzer/MessageAnalyzerPrompt";

/**
 * Request approval from user for high-risk operations
 * Shows analysis details and waits for user confirmation
 */
export async function requestApprovalFromUser(
  message: Message, 
  analysisResult: AnalysisResult
): Promise<boolean> {
  
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Display risk analysis
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  HIGH-RISK OPERATION DETECTED');
    console.log('='.repeat(60));
    console.log(`🎯 Intent: ${analysisResult.intent}`);
    console.log(`🔧 Tool: ${analysisResult.tool_suggestion}`);
    console.log(`📊 Confidence: ${analysisResult.confidence}%`);
    console.log(`📝 Message: "${message.content}"`);
    
    if (analysisResult.parameters && Object.keys(analysisResult.parameters).length > 0) {
      console.log(`⚙️  Parameters:`);
      Object.entries(analysisResult.parameters).forEach(([key, value]) => {
        console.log(`   - ${key}: ${JSON.stringify(value)}`);
      });
    }
    
    console.log('='.repeat(60));
    
    // Ask for confirmation
    rl.question('\n❓ Approve this operation? (yes/no): ', (answer) => {
      rl.close();
      
      const normalized = answer.trim().toLowerCase();
      const approved = normalized === 'yes' || normalized === 'y' || 
                      normalized === 'approve' || normalized === 'evet';
      
      if (approved) {
        message.logger.info(`✅ User approved the high-risk operation.`);
        resolve(true);
      } else {
        message.logger.info(`❌ User denied the high-risk operation.`);
        resolve(false);
      }
    });
  });
}