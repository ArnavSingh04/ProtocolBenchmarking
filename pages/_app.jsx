import "../client/main.css";
import "../client/layouts/MainLayout.css";
import "../client/components/AttributeSelector.css";
import "../client/components/ProtocolSelector.css";
import "../client/components/ScenarioSelector.css";
import "../client/components/TestProgressLog.css";
import "../client/pages/ConfigurationPage.css";
import "../client/pages/Dashboard.css";
import "../client/pages/ResultsPage.css";
import "../client/pages/HistoryPage.css";
import "../client/pages/LiveProgressPage.css";

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
