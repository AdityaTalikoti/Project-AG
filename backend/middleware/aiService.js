/**
 * Mock AI Service for evaluating Task-Idea pairs
 * In production, this would call OpenAI/Anthropic API
 */
export const evaluateJournal = async (task, idea) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Simple heuristic for demo purposes
  const match = idea.length > 15;
  
  if (match) {
    return {
      match: true,
      feedback: "Strong theoretical connection. Your idea aligns well with the execution.",
      nextStep: "Consider optimizing the code or writing unit tests."
    };
  } else {
    return {
      match: false,
      feedback: "The idea seems a bit superficial compared to the task. Please explain *why* you chose this approach.",
      nextStep: "Review the theoretical concept behind this implementation."
    };
  }
};
