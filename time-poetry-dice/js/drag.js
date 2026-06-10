export function initTagDrag(container, words, onChange) {
  let order = [...words];
  let dragUsed = false;

  function render() {
    container.innerHTML = "";
    order.forEach((word, index) => {
      const tag = document.createElement("button");
      tag.type = "button";
      tag.className = "tag-card";
      tag.textContent = word;
      tag.draggable = true;
      tag.dataset.index = String(index);

      tag.addEventListener("dragstart", (e) => {
        dragUsed = true;
        tag.classList.add("tag-card--dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(index));
      });

      tag.addEventListener("dragend", () => {
        tag.classList.remove("tag-card--dragging");
      });

      tag.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        tag.classList.add("tag-card--over");
      });

      tag.addEventListener("dragleave", () => {
        tag.classList.remove("tag-card--over");
      });

      tag.addEventListener("drop", (e) => {
        e.preventDefault();
        tag.classList.remove("tag-card--over");
        const from = Number(e.dataTransfer.getData("text/plain"));
        const to = Number(tag.dataset.index);
        if (from === to) return;

        const next = [...order];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        order = next;
        render();
        onChange(order, dragUsed);
      });

      container.appendChild(tag);
    });
  }

  render();
  onChange(order, false);

  return {
    getOrder: () => [...order],
    setOrder: (next) => {
      order = [...next];
      render();
      onChange(order, dragUsed);
    },
    wasDragUsed: () => dragUsed,
  };
}
