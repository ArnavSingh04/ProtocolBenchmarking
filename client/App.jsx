import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TestRunProvider } from "./contexts/TestRunContext";
import MainLayout from "./layouts/MainLayout";
import ConfigurationPage from "./pages/ConfigurationPage";
import ResultsPage from "./pages/ResultsPage";
import HistoryPage from "./pages/HistoryPage";
import LiveProgressPage from "./pages/LiveProgressPage";

function App() {
  return (
    <ThemeProvider>
      <TestRunProvider>
        <MainLayout>
          <Routes>
            <Route path="/" element={<ConfigurationPage />} />
            <Route
              path="/dashboard"
              element={<Navigate to="/results" replace />}
            />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/live" element={<LiveProgressPage />} />
          </Routes>
        </MainLayout>
      </TestRunProvider>
    </ThemeProvider>
  );
}

export default App;
