import { setButtonLoading } from "./dom.js";

export function initSecurityForm() {
  const securityForm = document.querySelector("#security-form");
  const securityStatus = document.querySelector("#security-status");
  const securitySaveButton = document.querySelector("#security-save-button");
  const writeAllow = document.querySelector("#write-allow");
  const readDeny = document.querySelector("#read-deny");

  if (!securityForm || !securityStatus || !securitySaveButton || !writeAllow || !readDeny) {
    return;
  }

  const initialSaveText = securitySaveButton.textContent;

  securityForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setButtonLoading(securitySaveButton, "保存中...");
    securityStatus.textContent = "";

    try {
      const response = await fetch("/api/security-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          write_allow_text: writeAllow.value,
          read_deny_text: readDeny.value,
        }),
      });

      if (!response.ok) {
        throw new Error(`request failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "save failed");
      }

      writeAllow.value = data.write_allow_text || "";
      readDeny.value = data.read_deny_text || "";
      securityStatus.textContent = "已保存";
    } catch (error) {
      securityStatus.textContent = "保存失败，请检查路径或日志。";
    } finally {
      setButtonLoading(securitySaveButton, initialSaveText, false);
    }
  });
}
