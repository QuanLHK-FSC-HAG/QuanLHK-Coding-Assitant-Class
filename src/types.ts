export type Language = "cpp";

export interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export interface HsgAnalysis {
  problemTitle: string;
  problemSummary: string;
  algorithmName: string;
  thinkingSteps: string;
  complexity: string;
  referenceLinks: { title: string; url: string; source: string }[];
}

export interface HsgPreset {
  title: string;
  url: string;
  description: string;
}
