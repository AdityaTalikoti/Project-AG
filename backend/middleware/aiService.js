import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

// Fallback logic
const evaluateJournalFallback = (idea) => {
  const match = idea.length > 15;
  if (match) {
    return {
      match: true,
      feedback: "Strong theoretical connection. Your idea aligns well with the execution. (Fallback Mode)",
      nextStep: "Consider optimizing the code or writing unit tests."
    };
  } else {
    return {
      match: false,
      feedback: "The idea seems a bit superficial compared to the task. Please explain *why* you chose this approach. (Fallback Mode)",
      nextStep: "Review the theoretical concept behind this implementation."
    };
  }
};

/**
 * AI Service for evaluating Task-Idea pairs using Google Gemini
 */
export const evaluateJournal = async (task, idea) => {
  if (!genAI) {
    console.warn("GEMINI_API_KEY is not defined. Using mock fallback evaluation.");
    await new Promise(resolve => setTimeout(resolve, 800));
    return evaluateJournalFallback(idea);
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
You are an educational AI mentor. Evaluate the relationship between a user's task and their proposed implementation idea.
Task: "${task}"
Idea/Approach: "${idea}"

Respond with a JSON object containing:
- "match" (boolean): true if the idea has a valid, strong theoretical and practical connection to the task; false if the idea is superficial, incorrect, or lacks depth relative to the task.
- "feedback" (string): Constructive educational feedback explaining the connection, strengths of their approach, or gaps in understanding. Keep it under 3-4 sentences.
- "nextStep" (string): A concrete, actionable next step for the student to take (e.g. optimizing their approach, reviewing a concept, or writing a specific test).
`;

    const response = await model.generateContent(prompt);
    const text = response.response.text();
    const result = JSON.parse(text);

    // Validate structure of parsed result
    if (typeof result.match === 'boolean' && result.feedback && result.nextStep) {
      return result;
    }
    
    throw new Error("Invalid response format from Gemini");
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return evaluateJournalFallback(idea);
  }
};

