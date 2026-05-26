// Chatgpt by openAI was used to assist in the writing the code for the following file
import React from "react";
import { Routes, Route } from "react-router-dom";
import { TestRunProvider } from "./contexts/TestRunContext";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import ConfigurationPage from "./pages/ConfigurationPage";
import ResultsPage from "./pages/ResultsPage";
import HistoryPage from "./pages/HistoryPage";
import LiveProgressPage from "./pages/LiveProgressPage";

function App() {
  return (
    <TestRunProvider>
      <MainLayout>
        <Routes>
          <Route path="/" element={<ConfigurationPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/live" element={<LiveProgressPage />} />
        </Routes>
      </MainLayout>
    </TestRunProvider>
  );
}

export default App;
