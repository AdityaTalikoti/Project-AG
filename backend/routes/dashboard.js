import express from 'express';
import authMiddleware from '../middleware/auth.js';
import Journal from '../models/Journal.js';
import Goal from '../models/Goal.js';
import FocusSession from '../models/FocusSession.js';
import User from '../models/User.js';
import Roadmap from '../models/Roadmap.js';

function getLocalDateStr(date, timezone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    return `${year}-${month}-${day}`;
  } catch (e) {
    return new Date(date).toISOString().split('T')[0];
  }
}

const router = express.Router();

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;
    const clientTimezone = req.query.timezone || 'UTC';
    const user = await User.findById(studentId);
    const dailyTarget = user?.dailyTarget || 60; // daily target in minutes (default 60 minutes)

    const journals = await Journal.find({ studentId }).sort({ createdAt: -1 });
    const focusSessions = await FocusSession.find({ studentId }).sort({ createdAt: -1 });

    // Group journal logs by date (timezone aware)
    const journalMap = {};
    journals.forEach(j => {
      const dateStr = getLocalDateStr(new Date(j.createdAt), clientTimezone);
      if (!journalMap[dateStr]) {
        journalMap[dateStr] = { count: 0, score: 0 };
      }
      journalMap[dateStr].count += 1;
      journalMap[dateStr].score += j.aiFeedback?.match ? 10 : 4;
    });

    // Group focus sessions by date (timezone aware)
    const focusSessionMap = {};
    focusSessions.forEach(s => {
      const dateStr = getLocalDateStr(new Date(s.createdAt), clientTimezone);
      if (!focusSessionMap[dateStr]) {
        focusSessionMap[dateStr] = 0;
      }
      focusSessionMap[dateStr] += s.duration / 3600; // convert seconds to hours
    });

    // Generate heatmap for the last 90 days (timezone aware)
    const heatmap = Array.from({ length: 90 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (89 - i));
      const dateStr = getLocalDateStr(d, clientTimezone);

      const realData = journalMap[dateStr];
      if (realData) {
        return {
          date: dateStr,
          count: realData.count,
          score: Math.min(realData.score, 10)
        };
      }

      return {
        date: dateStr,
        count: 0,
        score: 0
      };
    });

    // Fetch all completed roadmap tasks and their completedAt dates
    const completedTasksDates = [];
    const roadmaps = await Roadmap.find({ studentId });
    roadmaps.forEach(r => {
      r.modules.forEach(m => {
        m.tasks.forEach(t => {
          if (t.completed && t.completedAt) {
            completedTasksDates.push(getLocalDateStr(new Date(t.completedAt), clientTimezone));
          }
        });
      });
    });

    // Group active days (focus sessions, journals, or completed roadmap tasks) by date
    const activeDaysMap = {};
    const focusSessionDates = focusSessions.map(s => getLocalDateStr(new Date(s.createdAt), clientTimezone));
    const journalDates = journals.map(j => getLocalDateStr(new Date(j.createdAt), clientTimezone));
    const allUniqueDates = Array.from(new Set([...focusSessionDates, ...journalDates, ...completedTasksDates]));

    const completedTasksMap = {};
    completedTasksDates.forEach(dateStr => {
      completedTasksMap[dateStr] = true;
    });

    allUniqueDates.forEach(dateStr => {
      const journalMin = journalMap[dateStr] ? 180 : 0;
      const actualFocusMin = (focusSessionMap[dateStr] || 0) * 60;
      const totalMin = journalMin + actualFocusMin;
      if (totalMin >= dailyTarget || completedTasksMap[dateStr]) {
        activeDaysMap[dateStr] = true;
      }
    });

    const activeDates = Object.keys(activeDaysMap).sort((a, b) => new Date(a) - new Date(b));

    // Calculate actual streak based on activeDaysMap
    let streak = 0;
    let checkDate = new Date();
    const todayStr = getLocalDateStr(checkDate, clientTimezone);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday, clientTimezone);

    let startFrom = todayStr;
    if (!activeDaysMap[todayStr] && activeDaysMap[yesterdayStr]) {
      startFrom = yesterdayStr;
      checkDate = yesterday;
    }

    if (activeDaysMap[startFrom]) {
      while (true) {
        const dateStr = getLocalDateStr(checkDate, clientTimezone);
        if (activeDaysMap[dateStr]) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Calculate Best Streak based on activeDates
    let bestStreak = 0;
    let currentStreak = 0;
    let prevDate = null;
    
    for (let i = 0; i < activeDates.length; i++) {
      const currDate = new Date(activeDates[i]);
      if (prevDate === null) {
        currentStreak = 1;
      } else {
        const diffTime = currDate - prevDate;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      }
      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
      }
      prevDate = currDate;
    }

    // AI Insight has been moved to a dedicated endpoint GET /api/ai/dashboard-insight (Phase 6)
    const aiInsight = null;

    // Calculate weekly progress focus hours for the last 7 days dynamically
    // Count focus hours daily and show the graph on the basis of it (using actual focus sessions)
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyProgress = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      const dateStr = getLocalDateStr(d, clientTimezone);
      
      const actualFocusHours = focusSessionMap[dateStr] || 0.0;
      const totalHours = Number(actualFocusHours.toFixed(1));
      
      return {
        day: daysOfWeek[d.getDay()],
        hours: totalHours
      };
    });

    // Calculate previous weekly progress focus hours (last 7-14 days)
    const previousWeeklyProgress = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - idx));
      const dateStr = getLocalDateStr(d, clientTimezone);
      
      const actualFocusHours = focusSessionMap[dateStr] || 0.0;
      const totalHours = Number(actualFocusHours.toFixed(1));
      
      return {
        day: daysOfWeek[d.getDay()],
        hours: totalHours
      };
    });

    // Calculate current week dots (Monday to Sunday) based on target
    const currentWeekDots = [];
    const today = new Date();
    const day = today.getDay();
    const mondayDiff = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(today.setDate(mondayDiff));

    const daysLabel = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const dateStr = getLocalDateStr(d, clientTimezone);
      currentWeekDots.push({
        label: daysLabel[i],
        active: !!activeDaysMap[dateStr]
      });
    }

    // Focus Hours trend comparison (this week vs last week)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekJournalsCount = journals.filter(j => new Date(j.createdAt) >= sevenDaysAgo).length;
    const lastWeekJournalsCount = journals.filter(j => new Date(j.createdAt) >= fourteenDaysAgo && new Date(j.createdAt) < sevenDaysAgo).length;

    const thisWeekFocusSessionsSum = focusSessions
      .filter(s => new Date(s.createdAt) >= sevenDaysAgo)
      .reduce((sum, s) => sum + (s.duration / 3600), 0);
      
    const lastWeekFocusSessionsSum = focusSessions
      .filter(s => new Date(s.createdAt) >= fourteenDaysAgo && new Date(s.createdAt) < sevenDaysAgo)
      .reduce((sum, s) => sum + (s.duration / 3600), 0);

    const todayFocusHours = focusSessionMap[todayStr] || 0.0;

    const yesterdayFocusHours = focusSessionMap[yesterdayStr] || 0.0;

    const currentFocusHours = todayFocusHours;
    const lastFocusHours = yesterdayFocusHours;

    let focusHoursTrend = 0;
    if (lastFocusHours > 0) {
      focusHoursTrend = Math.round(((currentFocusHours - lastFocusHours) / lastFocusHours) * 100);
    } else if (currentFocusHours > 0) {
      focusHoursTrend = 100;
    }

    // Tasks completed (count journals logged)
    const totalTasksCompleted = journals.length;
    let tasksCompletedTrend = 0;
    if (lastWeekJournalsCount > 0) {
      tasksCompletedTrend = Math.round(((thisWeekJournalsCount - lastWeekJournalsCount) / lastWeekJournalsCount) * 100);
    }

    // Consistency score (Forgiving Health Bar)
    let consistencyScore = 100;
    
    if (journals.length === 0 && focusSessions.length === 0) {
      consistencyScore = 0;
    } else {
      const registrationDateStr = getLocalDateStr(new Date(user.createdAt), clientTimezone);
      
      // Loop through each day from user registration to today (capped at last 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const startDateStr = getLocalDateStr(thirtyDaysAgo, clientTimezone);
      const startFromStr = registrationDateStr > startDateStr ? registrationDateStr : startDateStr;
      
      const dates = [];
      let current = new Date(startFromStr + 'T00:00:00');
      const end = new Date(todayStr + 'T00:00:00');
      
      while (current <= end) {
        dates.push(getLocalDateStr(current, clientTimezone));
        current.setDate(current.getDate() + 1);
      }
      
      dates.forEach(dateStr => {
        const journalMin = journalMap[dateStr] ? 180 : 0;
        const actualFocusMin = (focusSessionMap[dateStr] || 0) * 60;
        const totalMin = journalMin + actualFocusMin;
        
        const isToday = (dateStr === todayStr);
        
        if (totalMin >= dailyTarget) {
          consistencyScore = Math.min(100, consistencyScore + 1);
        } else if (!isToday) {
          if (totalMin > 0) {
            consistencyScore = Math.max(0, consistencyScore - 1);
          } else {
            consistencyScore = Math.max(0, consistencyScore - 2);
          }
        }
      });
    }

    let consistencyLabel = 'Needs Practice';
    if (consistencyScore >= 80) {
      consistencyLabel = 'Excellent';
    } else if (consistencyScore >= 50) {
      consistencyLabel = 'Good';
    } else if (consistencyScore >= 20) {
      consistencyLabel = 'Fair';
    }

    // Fetch upcoming tasks from Active Goal
    const activeGoal = await Goal.findOne({ studentId, status: 'Active' });
    let upcomingTasks = [];
    if (activeGoal) {
      upcomingTasks = activeGoal.subTasks
        .filter(t => !t.completed)
        .map((t, index) => ({
          id: t._id,
          title: t.title,
          status: index === 0 ? "current" : "upcoming",
          priority: index === 0 ? "high" : (index === 1 ? "medium" : "low"),
          time: index === 0 ? "2h" : "1.5h"
        }));
    }

    // Achievements calculation
    const achievements = [];
    if (streak >= 3) {
      achievements.push({
        id: 1,
        title: "Consistency King",
        desc: `${streak} Days Streak`,
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      });
    }

    const hasEarlyBird = journals.some(j => {
      const hr = new Date(j.createdAt).getHours();
      return hr >= 4 && hr < 9;
    });
    if (hasEarlyBird) {
      achievements.push({
        id: 2,
        title: "Early Bird",
        desc: "Early Riser Coder",
        color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
      });
    }

    if (totalTasksCompleted >= 5) {
      achievements.push({
        id: 3,
        title: "Problem Solver",
        desc: `${totalTasksCompleted} Tasks`,
        color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
      });
    }

    if (journals.length >= 10) {
      achievements.push({
        id: 4,
        title: "Journal Master",
        desc: `${journals.length} Entries`,
        color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
      });
    }

    // Dynamic level and XP info
    // Journals: 100 XP. Match AI feedback: +50 XP.
    // Full Pomodoro focus session (>= 25 min / 1500s): +50 XP.
    // Full Long focus session (>= 45 min / 2700s): +100 XP.
    let focusSessionXp = 0;
    focusSessions.forEach(s => {
      if (s.duration >= 2700) {
        focusSessionXp += 100;
      } else if (s.duration >= 1500) {
        focusSessionXp += 50;
      }
    });

    const activeRoadmap = await Roadmap.findOne({ studentId, active: true });
    let roadmapXp = 0;
    if (activeRoadmap) {
      activeRoadmap.modules.forEach(m => {
        m.tasks.forEach(t => {
          if (t.completed) {
            roadmapXp += (t.xpReward || 50);
          }
        });
      });
    }

    const totalXp = journals.length * 100 + (journals.filter(j => j.aiFeedback?.match).length * 50) + focusSessionXp + roadmapXp;
    const level = Math.floor(totalXp / 1000) + 1;
    const xp = totalXp % 1000;
    const maxXp = 1000;
    const roleName = activeRoadmap ? activeRoadmap.title : "Student";
    const levelInfo = {
      level,
      name: level >= 5 ? `Senior ${roleName}` : (level >= 3 ? `${roleName} Scholar` : `${roleName} Explorer`),
      xp,
      maxXp
    };

    res.json({
      success: true,
      data: {
        focusHours: { current: currentFocusHours, trend: focusHoursTrend },
        tasksCompleted: { current: totalTasksCompleted, trend: tasksCompletedTrend },
        streak,
        bestStreak,
        consistency: {
          score: consistencyScore,
          label: consistencyLabel
        },
        weeklyProgress,
        previousWeeklyProgress,
        heatmap,
        currentWeekDots,
        upcomingTasks,
        achievements,
        levelInfo,
        aiInsight,
        hasActiveRoadmap: !!activeRoadmap,
        activeRoadmap: activeRoadmap ? {
          id: activeRoadmap._id,
          title: activeRoadmap.title,
          completionPercentage: activeRoadmap.completionPercentage,
          category: activeRoadmap.category,
          activeModuleName: activeRoadmap.modules.find(m => m.status === 'in-progress')?.title || 'All Modules Completed',
          completedModulesCount: activeRoadmap.modules.filter(m => m.status === 'completed').length,
          inProgressModulesCount: activeRoadmap.modules.filter(m => m.status === 'in-progress').length,
          totalModulesCount: activeRoadmap.modules.length
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
