import init, { run_source_web } from "./pkg/ziium.js";

const wasmStatus = document.querySelector("#wasmStatus");
const runButtons = [...document.querySelectorAll(".rosetta-run")];
const sections = [...document.querySelectorAll(".rosetta-section")];

async function main() {
  try {
    await init();
    wasmStatus.textContent = "WASM 준비 완료";
    wasmStatus.classList.add("is-ready");
    for (const button of runButtons) {
      button.disabled = false;
    }
    bindRunButtons();
  } catch (error) {
    wasmStatus.textContent = "WASM 로드 실패";
    wasmStatus.classList.add("is-error");
    for (const button of runButtons) {
      const fallback = document.createElement("a");
      fallback.href = "./index.html";
      fallback.textContent = "Playground에서 실행";
      fallback.className = "rosetta-fallback-link";
      button.replaceWith(fallback);
    }
  }

  bindTabs();
}

function bindRunButtons() {
  for (const button of runButtons) {
    button.addEventListener("click", () => {
      const source = button.dataset.source;
      const outputEl = button.closest(".rosetta-col-ziium").querySelector(".rosetta-output");
      runExample(source, outputEl, button);
    });
  }
}

function runExample(source, outputEl, button) {
  button.textContent = "...";
  const result = run_source_web(source);

  if (!result.ok) {
    outputEl.textContent = result.error;
    outputEl.style.color = "#c62828";
    button.textContent = "Run";
    return;
  }

  const events = JSON.parse(result.execution_events_json || "[]");
  const lines = [];
  for (const event of events) {
    if (event.kind === "Output") {
      lines.push(event.text);
    }
  }

  outputEl.textContent = lines.length === 0 ? "(출력 없음)" : lines.join("\n");
  outputEl.style.color = "";
  button.textContent = "Run";
}

function bindTabs() {
  for (const section of sections) {
    const tabs = [...section.querySelectorAll(".rosetta-tab")];
    const examples = [...section.querySelectorAll(".rosetta-example")];

    for (const tab of tabs) {
      tab.addEventListener("click", () => {
        const lang = tab.dataset.lang;

        for (const t of tabs) {
          t.classList.toggle("is-active", t === tab);
        }

        for (const example of examples) {
          const cols = [...example.querySelectorAll(".rosetta-col")];
          for (const col of cols) {
            col.classList.toggle("is-active", col.dataset.lang === lang);
          }
        }
      });
    }

    // Initialize: activate the first tab's columns on page load
    const firstLang = tabs[0]?.dataset.lang;
    if (firstLang) {
      for (const example of examples) {
        const cols = [...example.querySelectorAll(".rosetta-col")];
        for (const col of cols) {
          col.classList.toggle("is-active", col.dataset.lang === firstLang);
        }
      }
    }
  }
}

main().catch((error) => {
  wasmStatus.textContent = "초기화 실패";
  wasmStatus.classList.add("is-error");
});
