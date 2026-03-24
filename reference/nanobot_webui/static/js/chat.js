import { escapeHtml, formatNow, setButtonLoading } from "./dom.js";

export function initChatComposer() {
  const form = document.querySelector("#chat-form .composer-form");
  const textarea = document.querySelector("#content");
  const button = document.querySelector("#send-button");
  const hint = document.querySelector("#composer-hint");
  const turnList = document.querySelector("#turn-list");
  const emptyState = document.querySelector(".transcript-panel .empty-state");

  if (!form || !textarea || !button || !hint || !turnList) {
    return;
  }

  let submitting = false;
  const initialHint = hint.textContent;
  const initialButtonText = button.textContent;

  textarea.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }
    event.preventDefault();
    if (!submitting) {
      form.requestSubmit();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const text = textarea.value.trim();
    if (!text) {
      textarea.focus();
      return;
    }

    submitting = true;
    setButtonLoading(button, "处理中...");
    textarea.disabled = true;
    hint.textContent = "nanobot 正在处理这条消息...";

    const pendingTurn = buildPendingTurn(text);
    turnList.prepend(pendingTurn);
    if (emptyState) {
      emptyState.remove();
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: text,
          session_key: form.querySelector('input[name="session_key"]')?.value || "",
        }),
      });

      if (!response.ok) {
        throw new Error(`request failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "chat failed");
      }

      textarea.value = "";
      window.location.href = data.redirect_url;
    } catch (error) {
      pendingTurn.remove();
      hint.textContent = "发送失败，请重试。";
      textarea.disabled = false;
      setButtonLoading(button, "重试发送", false);
      textarea.focus();
      submitting = false;
    }
  });

  window.addEventListener("pageshow", () => {
    submitting = false;
    textarea.disabled = false;
    setButtonLoading(button, initialButtonText, false);
    hint.textContent = initialHint;
  });
}

function buildPendingTurn(userText) {
  const section = document.createElement("section");
  section.className = "turn-card is-pending";

  section.innerHTML = `
    <header class="turn-header">
      <div>
        <div class="turn-index">正在处理</div>
        <div class="turn-title">${escapeHtml(userText.slice(0, 72) || "新消息")}</div>
      </div>
      <div class="turn-time">${formatNow()}</div>
    </header>
    <div class="message-stack">
      <article class="message-card message-user">
        <div class="message-head">
          <span class="role-pill role-user">用户</span>
        </div>
        <pre class="message-content">${escapeHtml(userText)}</pre>
      </article>
      <article class="message-card message-assistant">
        <div class="message-head">
          <span class="role-pill role-assistant">助手</span>
        </div>
        <pre class="message-content">nanobot 正在思考，请稍候...</pre>
      </article>
    </div>
  `;

  return section;
}
