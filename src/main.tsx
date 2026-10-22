import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";

/**
 * モバイルブラウザやアプリ埋め込みビューア（ホスト側に可変の
 * ツールバー/ステータスバーがある環境）では、100vh/100dvh が
 * 実際に見えている領域と一致しないことがある。
 * visualViewportの実測値を --app-vh として反映し、
 * html/body/#root がそれを基準に高さを取るようにすることで、
 * HUDの中央十字線が常に実際の画面中央に来るようにする。
 */
function syncViewportHeight() {
  const h = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--app-vh", `${h}px`);
}
syncViewportHeight();
window.addEventListener("resize", syncViewportHeight);
window.visualViewport?.addEventListener("resize", syncViewportHeight);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
