import { GoogleGenAI } from "@google/genai";
import { Task, Member } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not configured. Please ensure process.env.API_KEY is set.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeProjectHealth = async (tasks: Task[], members: Member[]): Promise<string> => {
  try {
    const ai = getClient();
    
    // Prepare a concise context for the AI
    const tasksContext = tasks.map(t => {
      const assignee = members.find(m => m.id === t.assignedTo)?.name || 'Unknown';
      return `
        Task: ${t.title}
        Assignee: ${assignee}
        Goal: ${t.outcome}
        Due: ${t.dueDate}
        Progress: ${t.progress}%
        Latest Log: ${t.logs.length > 0 ? t.logs[t.logs.length - 1].note : 'No logs'}
      `;
    }).join('\n---\n');

    const prompt = `
      You are a Project Manager Assistant for a results-oriented leader. 
      The leader does not want details, but wants to know about RISKS and OUTCOMES.
      
      Analyze the following tasks. Identify:
      1. Which tasks are most likely to be delayed based on due date and current progress?
      2. Are there any specific people who are overloaded or stuck?
      
      Provide a concise "Executive Summary" (in Chinese) of the project health in 3-4 bullet points. 
      Do not list every task. Only highlight problems or significant successes.
      
      Tasks Data:
      ${tasksContext}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "无法生成分析报告。";

  } catch (error: any) {
    console.error("Gemini analysis failed:", error);
    
    if (error.message?.includes("API Key")) {
      return "请配置 Google Gemini API Key 以使用此功能。";
    }
    
    if (error.message?.includes("Failed to fetch")) {
      return "网络连接失败，无法访问 AI 服务。请检查网络设置。";
    }

    return "AI 分析服务暂时不可用，请稍后重试。";
  }
};