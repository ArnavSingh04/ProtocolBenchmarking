import { Html, Head, Main, NextScript } from "next/document";

// Runs before first paint to apply the persisted theme and avoid a flash of the
// wrong colour scheme. Kept dependency-free and inlined on purpose.
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme') || 'system';
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = stored === 'dark' || (stored === 'system' && prefersDark) ? 'dark' : 'light';
    document.documentElement.dataset.theme = resolved;
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta
          name="description"
          content="Compare MQTT, HTTP, WebSocket and CoAP against weighted quality attributes under realistic network scenarios."
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
