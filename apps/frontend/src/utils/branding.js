export function applyDocumentBranding({ title, faviconUrl }) {
  if (title) {
    document.title = title;
  }

  if (!faviconUrl) {
    return;
  }

  let favicon = document.querySelector("link[rel='icon']");

  if (!favicon) {
    favicon = document.createElement("link");
    favicon.setAttribute("rel", "icon");
    document.head.appendChild(favicon);
  }

  favicon.setAttribute("href", faviconUrl);
}
