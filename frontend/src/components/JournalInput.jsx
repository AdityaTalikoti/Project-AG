import React, { useState } from 'react';
import { useAddJournalMutation } from '../store/apiSlice';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function JournalInput() {
  const [task, setTask] = useState('');
  const [idea, setIdea] = useState('');
  const [addJournal, { isLoading }] = useAddJournalMutation();
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await addJournal({
        studentId: '60d0fe4f5311236168a109ca', // mock ID
        task,
        idea
      }).unwrap();
      
      setFeedback(result.data.aiFeedback);
      setTask('');
      setIdea('');
    } catch (err) {
      console.error('Failed to save journal', err);
    }
  };

  return (
    <div className="bg-dark-panel p-6 rounded-xl shadow-lg border border-gray-800">
      <h2 className="text-xl font-semibold mb-4 text-white">Log Daily Progress</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Task (What did you do?)</label>
          <input
            type="text"
            required
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white font-mono text-sm focus:ring-2 focus:ring-neon-green focus:border-transparent outline-none transition"
            placeholder="e.g., Built a binary search tree in C++"
            value={task}
            onChange={(e) => setTask(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Idea (Why did you do it?)</label>
          <textarea
            required
            rows={3}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white font-mono text-sm focus:ring-2 focus:ring-neon-green focus:border-transparent outline-none transition"
            placeholder="e.g., To achieve O(log n) search time for our dataset"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || task.length < 10 || idea.length < 10}
          className="w-full bg-neon-green text-gray-900 font-bold py-3 rounded-lg hover:bg-emerald-400 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Analyzing with AI...' : <><Send size={18} /> Submit Log</>}
        </button>
      </form>

      {feedback && (
        <div className={`mt-6 p-4 rounded-lg border flex gap-3 ${feedback.match ? 'bg-emerald-900/20 border-emerald-800/50' : 'bg-amber-900/20 border-amber-800/50'}`}>
          <div className="mt-1">
            {feedback.match ? <CheckCircle className="text-neon-green" size={20} /> : <AlertCircle className="text-amber-review" size={20} />}
          </div>
          <div>
            <h4 className={`font-semibold ${feedback.match ? 'text-neon-green' : 'text-amber-review'}`}>
              {feedback.match ? 'Concept Aligned' : 'Review Suggested'}
            </h4>
            <p className="text-gray-300 text-sm mt-1 mb-2">{feedback.feedback}</p>
            <div className="bg-gray-900 rounded p-2 text-xs border border-gray-800 text-gray-400">
              <span className="font-bold text-gray-300">Next Step:</span> {feedback.nextStep}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
