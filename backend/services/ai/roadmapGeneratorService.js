import { generateGeminiReply } from './geminiService.js';
import { validateRoadmapJSON } from './roadmapValidator.js';

// Fallback preset templates in case Gemini is unavailable
const getPresetMilestones = (category) => {
  switch (category) {
    case 'MERN Stack':
      return [
        {
          title: "Module 1: Modern JS & Web Foundations",
          description: "Establish semantic document layouts and modern ES6 scripting flows.",
          duration: "5 days",
          priority: "High",
          topics: [
            "Configure local dev environment & command shell",
            "Practice ES6 destructuring, map, and filter",
            "Develop semantic HTML layout with responsive CSS Flexbox"
          ],
          resources: ["MDN Web Docs", "javascript.info"]
        },
        {
          title: "Module 2: React Core Essentials",
          description: "Learn building blocks, functional hooks, and data bindings.",
          duration: "7 days",
          priority: "High",
          topics: [
            "Understand JSX compile rules, Components, and Props",
            "Configure local state utilizing useState & useEffect hooks",
            "Develop interactive stateful application"
          ],
          resources: ["React Docs (react.dev)", "freeCodeCamp React Course"]
        },
        {
          title: "Module 3: Node.js & Express Server Infrastructure",
          description: "Design modular API endpoints, handle requests, and route payloads.",
          duration: "6 days",
          priority: "Medium",
          topics: [
            "Initialize npm package and structure Express router",
            "Implement REST routes serving mocked JSON database data",
            "Write custom auth middleware parsing headers"
          ],
          resources: ["ExpressJS Guides", "Node.js documentation"]
        },
        {
          title: "Module 4: MongoDB & Integration",
          description: "Model data structures, build schemas, and deploy endpoints.",
          duration: "8 days",
          priority: "High",
          topics: [
            "Spin up Atlas MongoDB cluster and link using Mongoose",
            "Design database schemas mapping profile entities",
            "Configure production deployment pipelines"
          ],
          resources: ["Mongoose Docs", "MongoDB University"]
        }
      ];

    case 'DSA':
      return [
        {
          title: "Module 1: Complexity & Core Array Patterns",
          description: "Master Big O notations, indexing, and array iteration rules.",
          duration: "4 days",
          priority: "High",
          topics: [
            "Analyze time/space boundaries using Big O notation",
            "Implement binary search on sorted array segments",
            "Master sliding window boundary calculations"
          ],
          resources: ["LeetCode Study Plan", "GeeksforGeeks Data Structures"]
        },
        {
          title: "Module 2: Linked Structures & Stacks/Queues",
          description: "Implement pointer chains and manage sequential memory structures.",
          duration: "5 days",
          priority: "High",
          topics: [
            "Design node class structures for singly linked lists",
            "Implement stack operations utilizing linked nodes",
            "Resolve bracket pairings matching recursion patterns"
          ],
          resources: ["Visualgo.net", "LeetCode LinkedList problems"]
        },
        {
          title: "Module 3: Tree Structures & Graph Traversals",
          description: "Perform hierarchy navigations and manage graph search borders.",
          duration: "6 days",
          priority: "High",
          topics: [
            "Construct binary search trees and node insertions",
            "Implement DFS and BFS recursive navigations",
            "Model adjacency mapping arrays representing network nodes"
          ],
          resources: ["Kahn Academy Graph Algorithms", "LeetCode Tree tag"]
        },
        {
          title: "Module 4: Sorting Algorithms & DP Basics",
          description: "Compare execution limits and resolve overlapping problems.",
          duration: "7 days",
          priority: "Medium",
          topics: [
            "Implement merge sort dividing and grouping partitions",
            "Develop Fibonacci solvers using memoization caches"
          ],
          resources: ["Introduction to Algorithms (CLRS)", "DP Tutorial on Codeforces"]
        }
      ];

    case 'AI/ML':
      return [
        {
          title: "Module 1: Python Basics & NumPy/Pandas",
          description: "Establish scripting environment and analyze dataframe matrices.",
          duration: "5 days",
          priority: "High",
          topics: [
            "Configure Anaconda packages and Jupyter workspaces",
            "Solve matrix multiplications using vector arithmetic",
            "Clean data frame missing metrics using Pandas queries"
          ],
          resources: ["Kaggle Python Course", "NumPy User Guide"]
        },
        {
          title: "Module 2: Linear Regression & Supervised Learning",
          description: "Learn loss equations, cost metrics, and optimization gradients.",
          duration: "6 days",
          priority: "High",
          topics: [
            "Formulate mean squared error equations",
            "Optimize linear models using gradient descent loops",
            "Split raw arrays into train/test validation segments"
          ],
          resources: ["Andrew Ng Machine Learning Specialization", "Scikit-Learn Tutorials"]
        },
        {
          title: "Module 3: Neural Nets & Deep Learning Layers",
          description: "Configure activation functions and pass backprop equations.",
          duration: "7 days",
          priority: "High",
          topics: [
            "Design forward pass calculations through linear layers",
            "Implement backprop calculations resolving gradient chains"
          ],
          resources: ["3Blue1Brown Deep Learning Series", "PyTorch Tutorials"]
        },
        {
          title: "Module 4: Large Language Models & Prompt Designs",
          description: "Understand transformer pipelines and apply tuning rules.",
          duration: "6 days",
          priority: "Medium",
          topics: [
            "Query public endpoints using model client connectors",
            "Apply role mappings inside API request packages"
          ],
          resources: ["DeepLearning.AI Prompt Engineering", "Hugging Face Course"]
        }
      ];

    default: // Custom Fallback
      return [
        {
          title: "Module 1: Getting Started & Foundations",
          description: "Establish foundational concepts and configure local toolsets.",
          duration: "5 days",
          priority: "High",
          topics: [
            "Set up development utilities and local tools",
            "Review basics and fundamental concepts",
            "Complete initial prototype exercise"
          ],
          resources: ["Official Documentation", "Getting Started Guides"]
        },
        {
          title: "Module 2: Core Concept Implementations",
          description: "Perform advanced exercises and structure larger projects.",
          duration: "7 days",
          priority: "High",
          topics: [
            "Build modular structures managing data flow",
            "Connect basic services and APIs"
          ],
          resources: ["Best Practice Guides", "GitHub Sample Projects"]
        },
        {
          title: "Module 3: Advanced Applications",
          description: "Apply integration tests, handle edge cases, and tune performance.",
          duration: "6 days",
          priority: "Medium",
          topics: [
            "Identify bottlenecks and optimize query steps",
            "Add core unit test suites validating functions"
          ],
          resources: ["Performance Tuning Documentation", "Testing Framework Docs"]
        },
        {
          title: "Module 4: Production Review & Deploy",
          description: "Validate code cleanliness and launch public links.",
          duration: "5 days",
          priority: "High",
          topics: [
            "Deploy modular components to production cloud hosts"
          ],
          resources: ["Hosting Deployment Checklists"]
        }
      ];
  }
};

/**
 * Deduces category based on the goal string.
 */
export const deduceCategory = (goal = '') => {
  const normalizedGoal = goal.toLowerCase();
  if (normalizedGoal.includes('mern') || normalizedGoal.includes('node') || normalizedGoal.includes('express')) {
    return 'MERN Stack';
  } else if (normalizedGoal.includes('dsa') || normalizedGoal.includes('data structure') || normalizedGoal.includes('algorithm')) {
    return 'DSA';
  } else if (normalizedGoal.includes('ai') || normalizedGoal.includes('machine learning') || normalizedGoal.includes('ml')) {
    return 'AI/ML';
  } else if (normalizedGoal.includes('react')) {
    return 'React';
  } else if (normalizedGoal.includes('full stack') || normalizedGoal.includes('fullstack') || normalizedGoal.includes('web development')) {
    return 'Full Stack Development';
  } else if (normalizedGoal.includes('placement') || normalizedGoal.includes('interview') || normalizedGoal.includes('job prep')) {
    return 'Placement Preparation';
  }
  return 'Custom';
};

/**
 * Main service to compile prompt and generate roadmap.
 * Automatically falls back to presets if API key is invalid or Gemini down.
 *
 * @param {string} studentId
 * @param {Object} data - Goal, skillLevel, dailyCommitment, targetDate, learningStyle, existingKnowledge
 * @returns {Promise<Object>} The structured roadmap object
 */
export const generateAIOrFallbackRoadmap = async (studentId, data = {}) => {
  const {
    goal,
    skillLevel = 'Beginner',
    dailyCommitment = 60,
    targetDate = '',
    learningStyle = '',
    existingKnowledge = ''
  } = data;

  const category = deduceCategory(goal);

  try {
    const prompt = `You are a master academic curriculum designer. Your goal is to generate a highly customized and realistic learning roadmap for a student.

Student Details:
- Learning Goal: "${goal}"
- Current Experience Level: ${skillLevel}
- Daily Study Time Commitment: ${dailyCommitment} minutes
- Target Completion Date: ${targetDate ? `"${targetDate}"` : "Not specified (estimate a realistic timeline)"}
- Preferred Learning Style: ${learningStyle ? `"${learningStyle}"` : "Not specified (use standard text + hands-on resources)"}
- Existing Knowledge: ${existingKnowledge ? `"${existingKnowledge}"` : "None"}

Your task is to return a valid JSON object matching the schema below. 

Constraints:
- You must respond ONLY with a single JSON object.
- Do NOT wrap the JSON in markdown code blocks like \`\`\`json.
- Provide 3 to 5 chronological milestones/modules to keep the student motivated without overwhelming them.
- Each milestone must have realistic topics and resources.

JSON Structure:
{
  "title": "Roadmap title based on the goal",
  "estimatedDuration": "Total duration (e.g. 8 weeks)",
  "description": "Short overview description of what this roadmap achieves",
  "milestones": [
    {
      "title": "Module/Milestone Title (e.g., Module 1: Git & GitHub Foundations)",
      "description": "Short explanation of the learning outcome",
      "duration": "Estimated duration (e.g. 5 days or 2 weeks)",
      "priority": "High | Medium | Low",
      "topics": ["Key topic 1", "Key topic 2"],
      "resources": ["Resource 1 (e.g. YouTube tutorial, MDN documentation)", "Resource 2"]
    }
  ]
}
`;

    console.log('Sending custom prompt to Gemini for roadmap generation...');
    const reply = await generateGeminiReply(prompt);
    
    // Validate and clean
    const validated = validateRoadmapJSON(reply);
    return validated;
  } catch (error) {
    console.warn('Gemini roadmap generation failed, executing fallback template. Error:', error.message);
    
    const fallbackMilestones = getPresetMilestones(category);
    return {
      title: goal,
      estimatedDuration: data.timeline || '8 weeks',
      description: `Preset learning track for ${goal} (${category}). Built as an offline fallback.`,
      milestones: fallbackMilestones
    };
  }
};
