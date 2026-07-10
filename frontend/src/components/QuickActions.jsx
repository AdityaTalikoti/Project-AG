import React from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Play, Plus, UploadCloud } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    {
      name: "Add Today's Journal",
      icon: Edit3,
      path: "/dashboard/journal/new",
      color: "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5"
    },
    {
      name: "Start Focus Session",
      icon: Play,
      path: "/dashboard/focus",
      color: "border-purple-500/20 text-purple-400 hover:bg-purple-500/5"
    },
    {
      name: "Create Task",
      icon: Plus,
      path: "/dashboard/tasks",
      color: "border-blue-500/20 text-blue-400 hover:bg-blue-500/5"
    },
    {
      name: "Upload Resource",
      icon: UploadCloud,
      path: "/dashboard/resources",
      color: "border-orange-500/20 text-orange-400 hover:bg-orange-500/5"
    }
  ];

  return (
    <div className="bg-[#0a0e1a] p-5 rounded-2xl border border-[#121829] shadow-sm">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.name}
              to={act.path}
              className={`flex items-center gap-2.5 px-3 py-3 border rounded-xl text-xs font-semibold tracking-wide transition duration-200 cursor-pointer ${act.color}`}
            >
              <Icon size={16} />
              <span>{act.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
