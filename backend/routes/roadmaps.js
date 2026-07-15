import express from 'express';
import authMiddleware from '../middleware/auth.js';
import Roadmap from '../models/Roadmap.js';
import Event from '../models/Event.js';
import {
  handleGenerateRoadmap,
  handleAnalyzeSuggestions,
  handleSaveRoadmap
} from '../controllers/roadmapController.js';
import { syncRoadmapToCalendar } from '../services/ai/roadmapSyncService.js';

const router = express.Router();

// Preset generator utility
const getPresetModules = (category) => {
  switch (category) {
    case 'MERN Stack':
      return [
        {
          title: "Module 1: Modern JS & Web Foundations",
          description: "Establish semantic document layouts and modern ES6 scripting flows.",
          estimatedDuration: "5 days",
          status: "in-progress",
          tasks: [
            { title: "Configure local dev environment & command shell", description: "Install VS Code and verify terminal setup.", duration: "30 mins", xpReward: 50 },
            { title: "Practice ES6 destructuring, map, and filter", description: "Solve local scripting exercises using functional JS methods.", duration: "45 mins", xpReward: 50 },
            { title: "Develop semantic HTML layout with responsive CSS Flexbox", description: "Design a simple responsive grid structure.", duration: "1.5 hours", xpReward: 100 }
          ]
        },
        {
          title: "Module 2: React Core Essentials",
          description: "Learn building blocks, functional hooks, and data bindings.",
          estimatedDuration: "7 days",
          status: "locked",
          tasks: [
            { title: "Understand JSX compile rules, Components, and Props", description: "Build simple reusable cards passing structural props.", duration: "45 mins", xpReward: 50 },
            { title: "Configure local state utilizing useState & useEffect hooks", description: "Handle lifecycle hooks and manage component state variables.", duration: "1 hour", xpReward: 100 },
            { title: "Develop interactive stateful application", description: "Build a todo lists interface with filter views.", duration: "1.5 hours", xpReward: 100 }
          ]
        },
        {
          title: "Module 3: Node.js & Express Server Infrastructure",
          description: "Design modular API endpoints, handle requests, and route payloads.",
          estimatedDuration: "6 days",
          status: "locked",
          tasks: [
            { title: "Initialize npm package and structure Express router", description: "Establish route namespaces and map request methods.", duration: "30 mins", xpReward: 50 },
            { title: "Implement REST routes serving mocked JSON database data", description: "Expose GET, POST, PUT, DELETE REST methods.", duration: "1 hour", xpReward: 100 },
            { title: "Write custom auth middleware parsing headers", description: "Read auth headers and apply intercept guards.", duration: "1 hour", xpReward: 100 }
          ]
        },
        {
          title: "Module 4: MongoDB & Integration",
          description: "Model data structures, build schemas, and deploy endpoints.",
          estimatedDuration: "8 days",
          status: "locked",
          tasks: [
            { title: "Spin up Atlas MongoDB cluster and link using Mongoose", description: "Establish database socket connection safely.", duration: "45 mins", xpReward: 50 },
            { title: "Design database schemas mapping profile entities", description: "Apply validation constraints to data objects.", duration: "1 hour", xpReward: 100 },
            { title: "Configure production deployment pipelines", description: "Deploy client app and server to hosting platforms.", duration: "2 hours", xpReward: 150 }
          ]
        }
      ];

    case 'DSA':
      return [
        {
          title: "Module 1: Complexity & Core Array Patterns",
          description: "Master Big O notations, indexing, and array iteration rules.",
          estimatedDuration: "4 days",
          status: "in-progress",
          tasks: [
            { title: "Analyze time/space boundaries using Big O notation", description: "Evaluate linear and quadratic loop execution shapes.", duration: "30 mins", xpReward: 50 },
            { title: "Implement binary search on sorted array segments", description: "Understand logarithmic splits using two-pointer index steps.", duration: "1 hour", xpReward: 100 },
            { title: "Master sliding window boundary calculations", description: "Solve subarray search boundaries with window index shifts.", duration: "1.5 hours", xpReward: 100 }
          ]
        },
        {
          title: "Module 2: Linked Structures & Stacks/Queues",
          description: "Implement pointer chains and manage sequential memory structures.",
          estimatedDuration: "5 days",
          status: "locked",
          tasks: [
            { title: "Design node class structures for singly linked lists", description: "Build simple pointer nodes handling traversal steps.", duration: "45 mins", xpReward: 50 },
            { title: "Implement stack operations utilizing linked nodes", description: "Enforce LIFO constraints using stack pointer shifts.", duration: "1 hour", xpReward: 100 },
            { title: "Resolve bracket pairings matching recursion patterns", description: "Verify bracket nesting balances using local tracking stacks.", duration: "1 hour", xpReward: 100 }
          ]
        },
        {
          title: "Module 3: Tree Structures & Graph Traversals",
          description: "Perform hierarchy navigations and manage graph search borders.",
          estimatedDuration: "6 days",
          status: "locked",
          tasks: [
            { title: "Construct binary search trees and node insertions", description: "Write BST insertion guards and traversal prints.", duration: "1 hour", xpReward: 100 },
            { title: "Implement DFS and BFS recursive navigations", description: "Perform level-order and depth-first searches on matrices.", duration: "1.5 hours", xpReward: 100 },
            { title: "Model adjacency mapping arrays representing network nodes", description: "Parse directional edges into list objects.", duration: "1 hour", xpReward: 100 }
          ]
        },
        {
          title: "Module 4: Sorting Algorithms & DP Basics",
          description: "Compare execution limits and resolve overlapping problems.",
          estimatedDuration: "7 days",
          status: "locked",
          tasks: [
            { title: "Implement merge sort dividing and grouping partitions", description: "Merge sorted partitions efficiently.", duration: "1 hour", xpReward: 100 },
            { title: "Develop Fibonacci solvers using memoization caches", description: "Store subproblem metrics to cut computational steps.", duration: "1.5 hours", xpReward: 150 }
          ]
        }
      ];

    case 'AI/ML':
      return [
        {
          title: "Module 1: Python Basics & NumPy/Pandas",
          description: "Establish scripting environment and analyze dataframe matrices.",
          estimatedDuration: "5 days",
          status: "in-progress",
          tasks: [
            { title: "Configure Anaconda packages and Jupyter workspaces", description: "Initialize execution environments.", duration: "30 mins", xpReward: 50 },
            { title: "Solve matrix multiplications using vector arithmetic", description: "Apply NumPy broadcast methods to index values.", duration: "1 hour", xpReward: 100 },
            { title: "Clean data frame missing metrics using Pandas queries", description: "Map rows and normalize field formats.", duration: "1.5 hours", xpReward: 100 }
          ]
        },
        {
          title: "Module 2: Linear Regression & Supervised Learning",
          description: "Learn loss equations, cost metrics, and optimization gradients.",
          estimatedDuration: "6 days",
          status: "locked",
          tasks: [
            { title: "Formulate mean squared error equations", description: "Evaluate prediction discrepancies mathematically.", duration: "45 mins", xpReward: 50 },
            { title: "Optimize linear models using gradient descent loops", description: "Tune weight multipliers utilizing learning steps.", duration: "1.5 hours", xpReward: 100 },
            { title: "Split raw arrays into train/test validation segments", description: "Prevent model overfitting biases.", duration: "1 hour", xpReward: 100 }
          ]
        },
        {
          title: "Module 3: Neural Nets & Deep Learning Layers",
          description: "Configure activation functions and pass backprop equations.",
          estimatedDuration: "7 days",
          status: "locked",
          tasks: [
            { title: "Design forward pass calculations through linear layers", description: "Construct network dot products and sum activations.", duration: "1 hour", xpReward: 100 },
            { title: "Implement backprop calculations resolving gradient chains", description: "Derive weight modifications via layer slopes.", duration: "2 hours", xpReward: 150 }
          ]
        },
        {
          title: "Module 4: Large Language Models & Prompt Designs",
          description: "Understand transformer pipelines and apply tuning rules.",
          estimatedDuration: "6 days",
          status: "locked",
          tasks: [
            { title: "Query public endpoints using model client connectors", description: "Fetch model payloads safely.", duration: "1 hour", xpReward: 100 },
            { title: "Apply role mappings inside API request packages", description: "Leverage system directives for targeted responses.", duration: "1 hour", xpReward: 100 }
          ]
        }
      ];

    case 'React':
      return [
        {
          title: "Module 1: Components, Hooks, & UI Layouts",
          description: "Learn component lifecycle and manage simple states.",
          estimatedDuration: "4 days",
          status: "in-progress",
          tasks: [
            { title: "Develop JSX elements rendering custom array details", description: "Map listings using key arrays.", duration: "30 mins", xpReward: 50 },
            { title: "Manage interactive toggle fields using local state hooks", description: "Handle form clicks and update variables.", duration: "1 hour", xpReward: 100 }
          ]
        },
        {
          title: "Module 2: Advanced State & API Integrations",
          description: "Fetch server data and propagate updates across children.",
          estimatedDuration: "6 days",
          status: "locked",
          tasks: [
            { title: "Fetch mock database entries on view loads", description: "Leverage useEffect to call backend APIs.", duration: "1 hour", xpReward: 100 },
            { title: "Propagate variables using standard Context hooks", description: "Prevent complex multi-level prop drilling.", duration: "1 hour", xpReward: 100 }
          ]
        },
        {
          title: "Module 3: Redux Toolkit Integrations",
          description: "Configure central data stores and dispatch clean payloads.",
          estimatedDuration: "5 days",
          status: "locked",
          tasks: [
            { title: "Design Redux state slices and sync action handlers", description: "Define reducer logic.", duration: "1 hour", xpReward: 100 },
            { title: "Dispatch actions and pull store states in React views", description: "Configure selector helpers.", duration: "1.5 hours", xpReward: 100 }
          ]
        },
        {
          title: "Module 4: Optimizations & Bundle Deployments",
          description: "Leverage lazy loading and deploy production assets.",
          estimatedDuration: "5 days",
          status: "locked",
          tasks: [
            { title: "Split bundle packages utilizing lazy/Suspense wrappers", description: "Cut bundle sizes on startup load.", duration: "1 hour", xpReward: 100 },
            { title: "Build assets and host output packages on static servers", description: "Run build commands and host online.", duration: "1 hour", xpReward: 100 }
          ]
        }
      ];

    case 'Full Stack Development':
      return [
        {
          title: "Module 1: Database Modelling & REST API Pipelines",
          description: "Establish connections, map profiles, and build server logic.",
          estimatedDuration: "6 days",
          status: "in-progress",
          tasks: [
            { title: "Model user collections utilizing Mongoose schemas", description: "Define validations.", duration: "1 hour", xpReward: 100 },
            { title: "Configure mock controllers and API routing nodes", description: "Map request links.", duration: "1 hour", xpReward: 100 }
          ]
        },
        {
          title: "Module 2: Stateful Client App Construction",
          description: "Develop dashboards and handle authenticated routing.",
          estimatedDuration: "6 days",
          status: "locked",
          tasks: [
            { title: "Configure client routers protecting internal dashboard screens", description: "Validate auth tokens.", duration: "1 hour", xpReward: 100 },
            { title: "Consume API updates inside state-driven pages", description: "Connect fetch hooks.", duration: "1.5 hours", xpReward: 100 }
          ]
        },
        {
          title: "Module 3: Security & Session Persistences",
          description: "Secure communication tokens and persist preferences.",
          estimatedDuration: "5 days",
          status: "locked",
          tasks: [
            { title: "Configure secure server cookie storage rules", description: "Enforce HTTPS/HttpOnly safeguards.", duration: "1 hour", xpReward: 100 },
            { title: "Restore active user logins from stored preferences", description: "Auto-check cookies on mount.", duration: "1 hour", xpReward: 100 }
          ]
        },
        {
          title: "Module 4: Deployment & CI/CD Pipelines",
          description: "Automate code deployments and launch cloud databases.",
          estimatedDuration: "6 days",
          status: "locked",
          tasks: [
            { title: "Configure pipeline files running unit checks", description: "Automate verification steps.", duration: "1 hour", xpReward: 100 },
            { title: "Launch cloud containers serving production builds", description: "Deploy backend endpoints online.", duration: "1.5 hours", xpReward: 150 }
          ]
        }
      ];

    case 'Placement Preparation':
      return [
        {
          title: "Module 1: Quantitative Aptitude & Aptitude Practice",
          description: "Revise essential mathematical equations and logic patterns.",
          estimatedDuration: "5 days",
          status: "in-progress",
          tasks: [
            { title: "Review permutation and probability formulas", description: "Solve core analytical questions.", duration: "1 hour", xpReward: 100 },
            { title: "Solve logical puzzles under clock constraints", description: "Build pattern recognition skills.", duration: "1.5 hours", xpReward: 100 }
          ]
        },
        {
          title: "Module 2: DSA Intensive & Mock Coding Sessions",
          description: "Solve sorting, dynamic routing, and data layout problems.",
          estimatedDuration: "7 days",
          status: "locked",
          tasks: [
            { title: "Practice tree insertions and graph matrix searches", description: "Write traversal queries.", duration: "1.5 hours", xpReward: 100 },
            { title: "Participate in timed mock coding challenges", description: "Code algorithms efficiently.", duration: "2 hours", xpReward: 150 }
          ]
        },
        {
          title: "Module 3: CS Core Fundamentals & OOP Concepts",
          description: "Verify OS patterns, DBMS normalization, and class structures.",
          estimatedDuration: "5 days",
          status: "locked",
          tasks: [
            { title: "Revise process schedulers and transaction ACID rules", description: "Consolidate fundamental theoretical rules.", duration: "1.5 hours", xpReward: 100 },
            { title: "Model OOP relationships mapping class structures", description: "Demonstrate polymorphism.", duration: "1 hour", xpReward: 100 }
          ]
        },
        {
          title: "Module 4: Resume Building & Behavioral Prep",
          description: "Optimize project highlights and practice standard responses.",
          estimatedDuration: "4 days",
          status: "locked",
          tasks: [
            { title: "Refine resume layout formatting project highlights", description: "Highlight technical contributions.", duration: "1 hour", xpReward: 100 },
            { title: "Practice structured STAR response behavioral examples", description: "Outline situation, action, and results.", duration: "1 hour", xpReward: 100 }
          ]
        }
      ];

    default: // Custom Goal
      return [
        {
          title: "Module 1: Getting Started & Foundations",
          description: "Establish foundational concepts and configure local toolsets.",
          estimatedDuration: "5 days",
          status: "in-progress",
          tasks: [
            { title: "Set up development utilities and local tools", description: "Establish environment settings.", duration: "30 mins", xpReward: 50 },
            { title: "Review basics and fundamental concepts", description: "Read core documentation.", duration: "1 hour", xpReward: 100 },
            { title: "Complete initial prototype exercise", description: "Apply foundational rules.", duration: "1.5 hours", xpReward: 100 }
          ]
        },
        {
          title: "Module 2: Core Concept Implementations",
          description: "Perform advanced exercises and structure larger projects.",
          estimatedDuration: "7 days",
          status: "locked",
          tasks: [
            { title: "Build modular structures managing data flow", description: "Divide layouts and components.", duration: "1 hour", xpReward: 100 },
            { title: "Connect basic services and APIs", description: "Perform data updates.", duration: "1.5 hours", xpReward: 100 }
          ]
        },
        {
          title: "Module 3: Advanced Applications",
          description: "Apply integration tests, handle edge cases, and tune performance.",
          estimatedDuration: "6 days",
          status: "locked",
          tasks: [
            { title: "Identify bottlenecks and optimize query steps", description: "Profile execution timelines.", duration: "1.5 hours", xpReward: 100 },
            { title: "Add core unit test suites validating functions", description: "Write logical mock assertions.", duration: "1 hour", xpReward: 100 }
          ]
        },
        {
          title: "Module 4: Production Review & Deploy",
          description: "Validate code cleanliness and launch public links.",
          estimatedDuration: "5 days",
          status: "locked",
          tasks: [
            { title: "Deploy modular components to production cloud hosts", description: "Verify environment settings.", duration: "1.5 hours", xpReward: 150 }
          ]
        }
      ];
  }
};

// 1. GET /api/roadmaps/active
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;
    const roadmap = await Roadmap.findOne({ studentId, active: true });
    
    res.json({
      success: true,
      data: roadmap || null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. POST /api/roadmaps/generate
router.post('/generate', authMiddleware, handleGenerateRoadmap);

// 2b. POST /api/roadmaps/analyze-suggestions
router.post('/analyze-suggestions', authMiddleware, handleAnalyzeSuggestions);

// 2c. POST /api/roadmaps/save
router.post('/save', authMiddleware, handleSaveRoadmap);

// 3. POST /api/roadmaps/tasks/toggle
router.post('/tasks/toggle', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { roadmapId, taskId, completed } = req.body;

    const roadmap = await Roadmap.findOne({ _id: roadmapId, studentId });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: "Roadmap not found" });
    }

    // Locate the task
    let taskFound = false;
    for (let m = 0; m < roadmap.modules.length; m++) {
      const moduleObj = roadmap.modules[m];
      const taskObj = moduleObj.tasks.id(taskId);
      if (taskObj) {
        taskObj.completed = completed;
        taskObj.completedAt = completed ? new Date() : undefined;
        taskFound = true;
        break;
      }
    }

    if (!taskFound) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Recalculate status of all modules and lock/unlock sequencing
    let allPreviousModulesCompleted = true;
    let totalTasksCount = 0;
    let completedTasksCount = 0;

    for (let m = 0; m < roadmap.modules.length; m++) {
      const moduleObj = roadmap.modules[m];
      const moduleTasks = moduleObj.tasks;
      totalTasksCount += moduleTasks.length;
      
      const moduleCompletedTasks = moduleTasks.filter(t => t.completed).length;
      completedTasksCount += moduleCompletedTasks;

      if (moduleCompletedTasks === moduleTasks.length && moduleTasks.length > 0) {
        moduleObj.status = 'completed';
      } else {
        if (allPreviousModulesCompleted) {
          moduleObj.status = 'in-progress';
          allPreviousModulesCompleted = false; // first incomplete module gets set to in-progress
        } else {
          moduleObj.status = 'locked';
        }
      }
    }

    // Calculate overall completion percentage
    roadmap.completionPercentage = totalTasksCount > 0
      ? Math.round((completedTasksCount / totalTasksCount) * 100)
      : 0;

    await roadmap.save();

    res.json({
      success: true,
      data: roadmap
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. DELETE /api/roadmaps/active
router.delete('/active', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;
    const activeRoadmap = await Roadmap.findOne({ studentId, active: true });
    if (activeRoadmap) {
      await Event.deleteMany({ 
        roadmapId: activeRoadmap._id, 
        createdBy: studentId, 
        isRoadmapEvent: true 
      });
      await Roadmap.deleteOne({ _id: activeRoadmap._id });
    }
    res.json({ success: true, message: "Active roadmap deleted and associated calendar events cleared" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. POST /api/roadmaps/archive
router.post('/archive', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;
    await Roadmap.updateMany({ studentId, active: true }, { active: false });
    res.json({ success: true, message: "Active roadmap archived" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. GET /api/roadmaps/:id/sync-status
router.get('/:id/sync-status', authMiddleware, async (req, res) => {
  try {
    const roadmapId = req.params.id;
    const studentId = req.user.id;

    const roadmap = await Roadmap.findOne({ _id: roadmapId, studentId });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found' });
    }

    const events = await Event.find({ roadmapId, createdBy: studentId, isRoadmapEvent: true });

    if (events.length === 0) {
      return res.json({ success: true, status: 'Not Synced' });
    }

    if (events.length !== roadmap.modules.length) {
      return res.json({ success: true, status: 'Needs Update' });
    }

    // Sort events by start date/time and modules by index order
    const sortedEvents = [...events].sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
    const sortedModules = [...roadmap.modules];

    for (let i = 0; i < sortedModules.length; i++) {
      const mod = sortedModules[i];
      const evt = sortedEvents[i];

      const expectedTitle = mod.title;
      const expectedDescription = mod.description || '';

      if (evt.title !== expectedTitle || evt.description !== expectedDescription) {
        return res.json({ success: true, status: 'Needs Update' });
      }
    }

    res.json({ success: true, status: 'Synced' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. POST /api/roadmaps/:id/sync
router.post('/:id/sync', authMiddleware, async (req, res) => {
  try {
    const roadmapId = req.params.id;
    const studentId = req.user.id;

    await syncRoadmapToCalendar(roadmapId, studentId);

    res.json({
      success: true,
      message: 'Roadmap calendar events synced successfully',
      status: 'Synced'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
