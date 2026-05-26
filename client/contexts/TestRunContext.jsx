// Chatgpt by openAI was used to assist in the writing the code for the following file
import React, { createContext, useContext, useState, useEffect } from "react";

const TestRunContext = createContext();

export const useTestRunContext = () => {
  const context = useContext(TestRunContext);
  if (!context) {
    throw new Error("useTestRunContext must be used within TestRunProvider");
  }
  return context;
};

export const TestRunProvider = ({ children }) => {
  const [currentTestRunId, setCurrentTestRunId] = useState(() => {
    // Load from localStorage on init
    return localStorage.getItem("currentTestRunId") || null;
  });

  useEffect(() => {
    // Save to localStorage when it changes
    if (currentTestRunId) {
      localStorage.setItem("currentTestRunId", currentTestRunId);
    } else {
      localStorage.removeItem("currentTestRunId");
    }
  }, [currentTestRunId]);

  return (
    <TestRunContext.Provider value={{ currentTestRunId, setCurrentTestRunId }}>
      {children}
    </TestRunContext.Provider>
  );
};
