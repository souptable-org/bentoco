import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import outdent from "outdent"

export async function writeStaticFiles(plugins?: string[]) {
  const outDir = join(process.cwd(), ".medusa/client")

  await mkdir(outDir, { recursive: true })

  const promises = [
    writeCSSFile(outDir),
    writeEntryFile(outDir, plugins),
    writeHTMLFile(outDir),
  ]

  await Promise.all(promises)
}

async function writeCSSFile(outDir: string) {
  const css = outdent`
    @import "@bentoco/dashboard/css";

    @tailwind base;
    @tailwind components;
    @tailwind utilities;
  `

  await writeFile(join(outDir, "index.css"), css)
}

function getPluginName(index: number) {
  return `plugin${index}`
}

async function writeEntryFile(outDir: string, plugins?: string[]) {
  const entry = outdent`
    import App from "@bentoco/dashboard";
    import React from "react";
    import ReactDOM from "react-dom/client";
    import "./index.css";

    ${plugins
      ?.map((plugin, idx) => `import ${getPluginName(idx)} from "${plugin}"`)
      .join("\n")}

    let root = null

    if (!root) {
      root = ReactDOM.createRoot(document.getElementById("medusa"))
    }

    
    root.render(
      <React.StrictMode>
        <App plugins={[${plugins
          ?.map((_, idx) => getPluginName(idx))
          .join(", ")}]} />
      </React.StrictMode>
    )


    if (import.meta.hot) {
        import.meta.hot.accept()
    }
  `

  await writeFile(join(outDir, "entry.jsx"), entry)
}

async function writeHTMLFile(outDir: string) {
  // Inline theme + boot shell runs before JS/CSS to avoid a white flash on refresh.
  const html = outdent`
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta
                http-equiv="Content-Type"
                content="text/html; charset=UTF-8"
            />
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1, user-scalable=no"
            />
            <link rel="icon" href="data:," data-placeholder-favicon />
            <script>
              (function () {
                try {
                  var key = "medusa_admin_theme";
                  var stored = localStorage.getItem(key);
                  var dark =
                    stored === "dark" ||
                    ((stored === "system" || !stored) &&
                      window.matchMedia("(prefers-color-scheme: dark)").matches);
                  var theme = dark ? "dark" : "light";
                  var root = document.documentElement;
                  root.classList.remove("light", "dark");
                  root.classList.add(theme);
                  root.style.colorScheme = theme;
                } catch (e) {
                  document.documentElement.classList.add("dark");
                  document.documentElement.style.colorScheme = "dark";
                }
              })();
            </script>
            <style>
              html, body { margin: 0; min-height: 100%; background: #f4f4f5; color: #18181b; }
              html.dark, html.dark body { background: #18181b; color: #fafafa; }
              #medusa { min-height: 100vh; }
              #app-boot {
                position: fixed; inset: 0; z-index: 99999;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                gap: 1rem; background: #f4f4f5; color: #71717a;
                font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; font-size: 0.875rem;
              }
              html.dark #app-boot { background: #18181b; color: #a1a1aa; }
              #app-boot-spinner {
                width: 1.75rem; height: 1.75rem; border-radius: 9999px;
                border: 2px solid currentColor; border-top-color: transparent; opacity: 0.55;
                animation: app-boot-spin 0.7s linear infinite;
              }
              @media (prefers-reduced-motion: reduce) {
                #app-boot-spinner { animation: none; border-top-color: currentColor; opacity: 0.35; }
              }
              @keyframes app-boot-spin { to { transform: rotate(360deg); } }
            </style>
        </head>

        <body>
            <div id="medusa">
              <div id="app-boot" role="status" aria-live="polite" aria-busy="true">
                <div id="app-boot-spinner" aria-hidden="true"></div>
                <span>Loading…</span>
              </div>
            </div>
            <script type="module" src="./entry.jsx"></script>
        </body>
    </html>
  `

  await writeFile(join(outDir, "index.html"), html)
}
