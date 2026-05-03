import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import JournalPage from './pages/JournalPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="journal/new" element={<JournalPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
