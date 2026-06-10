export function showPage(pageId, render, updateHash = true) {
  const target = document.querySelector(`#${pageId}`);
  if (!target) return;

  document.querySelectorAll(".site-page").forEach((page) => page.classList.remove("active"));
  target.classList.add("active");

  document.querySelectorAll(".site-nav .page-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  if (updateHash) {
    history.replaceState(null, "", `#${pageId.replace("-page", "")}`);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  render();
}

export function bindNavigation(render) {
  document.querySelectorAll(".page-link").forEach((button) => {
    button.addEventListener("click", () => showPage(button.dataset.page, render));
  });

  document.querySelectorAll(".nav-tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab, .view").forEach((node) => node.classList.remove("active"));
      button.classList.add("active");
      document.querySelector(`#${button.dataset.view}`).classList.add("active");
      render();
    });
  });
}
