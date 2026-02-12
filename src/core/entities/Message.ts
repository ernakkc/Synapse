export interface Message {
  source: "cli" | "telegram" | "electron";
  content: string;
  timestamp: number;
  logger: any; 
}
