import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "./env";

export async function generateTradingSuggestions(stats: any, trades: any[]): Promise<string[]> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. Falling back to default suggestions.");
      return generateDefaultSuggestions(stats);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Prepare data for the prompt
    const prompt = `
      Act as a professional Forex Trading Coach and Risk Manager.
      I am providing you with my recent trading statistics and a summary of my last ${trades.length} trades.
      
      STATS:
      - Recent Win Rate: ${stats.recentWinRate}%
      - Max Consecutive Losses: ${stats.maxConsecutiveLosses}
      - Best Strategy: ${stats.bestStrategy} ($${stats.bestStrategyPnL})
      - Best Market: ${stats.bestMarket} ($${stats.bestMarketPnL})
      
      Based on this data, provide EXACTLY 4 concise, actionable trading suggestions (max 2 sentences each).
      Focus on psychology, risk management, and strategy improvement. 
      Return ONLY the suggestions, separated by a newline (no numbers, no bullet points).
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) {
      return generateDefaultSuggestions(stats);
    }
    
    return text.split('\n').map(s => s.trim()).filter(s => s.length > 5);
  } catch (error) {
    console.error("Failed to generate AI suggestions:", error);
    return generateDefaultSuggestions(stats);
  }
}

function generateDefaultSuggestions(stats: any): string[] {
  return [
    stats.bestStrategy
      ? `Your best performing strategy is "${stats.bestStrategy}" with $${stats.bestStrategyPnL} profit. Consider focusing more on this strategy.`
      : "Add strategy information to your trades for better insights.",
    stats.bestMarket
      ? `You perform best trading ${stats.bestMarket}. Consider specializing in this market.`
      : "Try logging markets to see where you perform best.",
    stats.bestSession
      ? `Your most profitable session is ${stats.bestSession}. Focus your trading during this session.`
      : "Log your trading sessions to optimize timing.",
    stats.maxConsecutiveLosses >= 3
      ? `You had ${stats.maxConsecutiveLosses} consecutive losses. Consider taking a break after 2 consecutive losses to avoid revenge trading.`
      : "Your risk management seems solid. Keep your losses small.",
    stats.recentWinRate < 40
      ? `Your recent win rate is ${stats.recentWinRate}%. Review your entry criteria and ensure you're waiting for high-probability setups.`
      : "Your recent win rate is good. Maintain discipline.",
  ];
}
