import init, { run_source_web, highlight_web } from "./pkg/ziium.js";

const wasmStatus = document.querySelector("#wasmStatus");
const runButtons = [...document.querySelectorAll(".rosetta-run")];
const sections = [...document.querySelectorAll(".rosetta-section")];

async function main() {
  highlightCodeBlocks();
  try {
    await init();
    wasmStatus.textContent = "WASM 준비 완료";
    wasmStatus.classList.add("is-ready");
    for (const button of runButtons) {
      button.disabled = false;
    }
    bindRunButtons();
    highlightZiiumBlocks();
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

function highlightZiiumBlocks() {
  const blocks = document.querySelectorAll(".rosetta-col-ziium pre > code");
  for (const code of blocks) {
    const source = code.textContent;
    if (source.trim()) {
      code.innerHTML = highlight_web(source);
    }
  }
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

function highlightCode(source, kwRe) {
  const pattern = new RegExp(
    `(#[^\\n]*)|(\"(?:\\\\.|[^\"])*\"|'(?:\\\\.|[^'])*')|(${kwRe.source})|(\\b\\d+(?:\\.\\d+)?\\b)`,
    "g",
  );
  let result = "";
  let lastIndex = 0;
  for (const m of source.matchAll(pattern)) {
    result += escapeHtml(source.slice(lastIndex, m.index));
    const [, cm, str, kw, num] = m;
    if (cm) result += `<span class="zh-cm">${escapeHtml(cm)}</span>`;
    else if (str) result += `<span class="zh-str">${escapeHtml(str)}</span>`;
    else if (kw) result += `<span class="zh-kw">${escapeHtml(kw)}</span>`;
    else if (num) result += `<span class="zh-num">${escapeHtml(num)}</span>`;
    lastIndex = m.index + m[0].length;
  }
  result += escapeHtml(source.slice(lastIndex));
  return result;
}

const PY_KW = /\b(def|if|elif|else|while|for|in|return|and|or|not|True|False|None|print|len|range)\b/;
const RB_KW = /\b(def|if|elsif|else|while|end|return|do|puts)\b/;

function highlightCodeBlocks() {
  for (const code of document.querySelectorAll('.rosetta-col[data-lang="python"] pre > code')) {
    code.innerHTML = highlightCode(code.textContent, PY_KW);
  }
  for (const code of document.querySelectorAll('.rosetta-col[data-lang="ruby"] pre > code')) {
    code.innerHTML = highlightCode(code.textContent, RB_KW);
  }
}

main().catch((error) => {
  wasmStatus.textContent = "초기화 실패";
  wasmStatus.classList.add("is-error");
});
