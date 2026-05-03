import React from 'react';
import JournalInput from '../components/JournalInput';

export default function JournalPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Today's Progress</h1>
        <p className="text-gray-400">Connect your execution with your theoretical understanding.</p>
      </div>
      <JournalInput />
    </div>
  );
}
