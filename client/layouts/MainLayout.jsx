// Chatgpt by openAI was used to assist in the writing the code for the following file
import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTestRunContext } from "../contexts/TestRunContext";

function MainLayout({ children }) {
  const [searchParams] = useSearchParams();
  const { currentTestRunId, setCurrentTestRunId } = useTestRunContext();
  const urlTestRunId = searchParams.get("testRunId");
  const testRunId = urlTestRunId || currentTestRunId;

  // Update context if URL has testRunId
  React.useEffect(() => {
    if (urlTestRunId) {
      setCurrentTestRunId(urlTestRunId);
    }
  }, [urlTestRunId, setCurrentTestRunId]);

  const getLinkWithTestRunId = (path) => {
    return testRunId ? `${path}?testRunId=${testRunId}` : path;
  };

  return (
    <div className="main-layout">
      <header className="header">
        <div className="container">
          <h1 className="logo">Protocol Comparison Tool</h1>
          <nav className="nav">
            <Link to="/" className="nav-link">
              Configuration
            </Link>
            <Link to="/history" className="nav-link">
              History
            </Link>
            <Link to={getLinkWithTestRunId("/live")} className="nav-link">
              Live Progress
            </Link>
            <Link to={getLinkWithTestRunId("/dashboard")} className="nav-link">
              Dashboard
            </Link>
            <Link to={getLinkWithTestRunId("/results")} className="nav-link">
              Results
            </Link>
          </nav>
        </div>
      </header>
      <main className="main-content">{children}</main>
      <footer className="footer">
        <p>
          &copy; 2024 Protocol Comparison Tool - Intelligent Protocol Analysis
        </p>
      </footer>
    </div>
  );
}

export default MainLayout;
