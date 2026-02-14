export interface Message {
  source: "cli" | "telegram" | "electron";
  content: string;
  timestamp: number;
  logger: any; 
  approval?: (message: Message, analysisResult: any) => Promise<boolean>;
}
