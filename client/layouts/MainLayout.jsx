import React, { useEffect, useState } from "react";
import { NavLink, Link, useLocation, useSearchParams } from "react-router-dom";
import { useTestRunContext } from "../contexts/TestRunContext";
import ThemeToggle from "../components/ThemeToggle";

const NAV_ITEMS = [
  { to: "/", label: "Configuration", exact: true },
  { to: "/live", label: "Live Progress", carriesRun: true },
  { to: "/results", label: "Results", carriesRun: true },
  { to: "/history", label: "History" }
];

function MainLayout({ children }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { currentTestRunId, latestTestRunId, setActiveTestRunId } =
    useTestRunContext();
  const urlTestRunId = searchParams.get("testRunId");
  const testRunId = urlTestRunId || currentTestRunId || latestTestRunId;
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (urlTestRunId) setActiveTestRunId(urlTestRunId);
  }, [urlTestRunId, setActiveTestRunId]);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  const linkTo = (item) =>
    item.carriesRun && testRunId
      ? { pathname: item.to, search: `?testRunId=${testRunId}` }
      : { pathname: item.to };

  const navClass = ({ isActive }) =>
    `nav-link${isActive ? " active" : ""}`;

  const year = new Date().getFullYear();

  return (
    <div className="main-layout">
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label="Protocol Benchmark home">
            <span className="brand-mark" aria-hidden="true">
              ⇄
            </span>
            <span className="brand-text">
              Protocol<span className="brand-accent">Bench</span>
            </span>
          </Link>

          <nav className="nav-desktop" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={linkTo(item)}
                end={item.exact}
                className={navClass}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            <ThemeToggle />
            <button
              type="button"
              className="menu-toggle"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className={`menu-icon${menuOpen ? " open" : ""}`} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="mobile-nav" className="nav-mobile" aria-label="Primary mobile">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={linkTo(item)}
                end={item.exact}
                className={navClass}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="main-content" id="main">
        {children}
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <span>
            ProtocolBench — communication protocol benchmarking, {year}
          </span>
          <span className="footer-note">
            Results are modelled unless a run is executed in Live mode.
          </span>
        </div>
      </footer>
    </div>
  );
}

export default MainLayout;
