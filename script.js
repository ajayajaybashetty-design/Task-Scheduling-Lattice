const tasks = [
  {id:"A",name:"Requirements Analysis",deps:[]},
  {id:"B",name:"Data Setup",deps:[]},
  {id:"C",name:"System Design",deps:["A"]},
  {id:"D",name:"Testing Plan",deps:["C"]},
  {id:"E",name:"Development",deps:["C","B"]},
  {id:"F",name:"Documentation",deps:["A"]},
  {id:"G",name:"Deployment",deps:["D","E","F"]}
];

let completed = new Set();

const taskList = document.getElementById("taskList");
const readyTasks = document.getElementById("readyTasks");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const readyTitle = document.getElementById("readyTitle");
const readyText = document.getElementById("readyText");
const scheduleOutput = document.getElementById("scheduleOutput");

function canComplete(task) {
  return task.deps.every(d => completed.has(d));
}

function getReady() {
  return tasks.filter(t => !completed.has(t.id) && canComplete(t));
}

function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach(t => {
    const done = completed.has(t.id);
    const ready = canComplete(t);

    const div = document.createElement("div");
    div.className =
      "task-item " +
      (done ? "done" : "") +
      (!ready && !done ? " locked" : "");

    div.innerHTML = `
      <div class="task-check">${done ? "✓" : ""}</div>
      <div class="task-info">
        <b>${t.id}. ${t.name}</b>
        <small>
          ${t.deps.length
            ? "Requires: " + t.deps.join(", ")
            : "No prerequisites"}
        </small>
      </div>
      <span class="status">
        ${done ? "Completed" : ready ? "Ready" : "Locked"}
      </span>
    `;

    if (!done && ready) {
      div.addEventListener("click", () => {
        completed.add(t.id);
        renderAll();
      });
    }

    taskList.appendChild(div);
  });
}

function renderResult() {
  const pct = Math.round((completed.size / tasks.length) * 100);

  progressBar.style.width = pct + "%";
  progressText.textContent = pct + "%";

  const ready = getReady();

  readyTasks.innerHTML = ready.length
    ? ready.map(t => `<span>${t.id} • ${t.name}</span>`).join("")
    : "";

  if (completed.size === tasks.length) {
    readyTitle.textContent = "Project Complete 🎉";
    readyText.textContent =
      "All tasks satisfy their prerequisites.";
  } else if (ready.length) {
    readyTitle.textContent =
      ready.map(t => t.id).join(", ") + " can start now";

    readyText.textContent =
      "These tasks have all required predecessors completed.";
  } else {
    readyTitle.textContent = "Waiting for prerequisites";
    readyText.textContent =
      "Complete the locked task's predecessors first.";
  }
}

function topoOrder() {
  const left = new Set(tasks.map(t => t.id));
  const order = [];

  while (left.size) {
    const next = tasks.find(
      t => left.has(t.id) &&
      t.deps.every(d => order.includes(d))
    );

    if (!next) break;

    order.push(next.id);
    left.delete(next.id);
  }

  return order;
}

function renderSchedule() {
  const order = topoOrder();

  scheduleOutput.innerHTML =
    order.map(id => `<span>${id}</span>`).join("");
}

function renderAll() {
  renderTasks();
  renderResult();
  renderSchedule();
  drawHasse();
}

document.getElementById("resetBtn").addEventListener("click", () => {
  completed.clear();
  renderAll();
});

document.getElementById("menuBtn").addEventListener("click", () => {
  document.getElementById("navLinks").classList.toggle("open");
});

function drawHasse() {
  const svg = document.getElementById("hasseSvg");

  const positions = {
    A: [150, 460],
    B: [350, 460],
    F: [650, 460],
    C: [220, 300],
    D: [520, 300],
    E: [390, 170],
    G: [390, 55]
  };

  const edges = tasks.flatMap(t =>
    t.deps.map(d => [d, t.id])
  );

  svg.innerHTML = `
    <defs>
      <marker
        id="arrow"
        markerWidth="10"
        markerHeight="10"
        refX="8"
        refY="3"
        orient="auto">
        <path d="M0,0 L0,6 L8,3 z" fill="#9ab4a9"/>
      </marker>
    </defs>
  `;

  const edgeGroup =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );

  edges.forEach(([a, b]) => {
    const [x1, y1] = positions[a];
    const [x2, y2] = positions[b];

    const line =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );

    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1 - 29);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2 + 29);

    line.setAttribute(
      "class",
      "edge " +
      (completed.has(a) && completed.has(b) ? "done" : "")
    );

    edgeGroup.appendChild(line);
  });

  svg.appendChild(edgeGroup);

  const nodeGroup =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );

  tasks.forEach(t => {
    const [x, y] = positions[t.id];

    const g =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );

    g.setAttribute(
      "class",
      "svg-node " +
      (completed.has(t.id) ? "done " : "") +
      (t.id === "G" ? "goal" : "")
    );

    g.innerHTML = `
      <circle cx="${x}" cy="${y}" r="30"></circle>
      <text
        class="letter"
        x="${x}"
        y="${y + 7}">
        ${t.id}
      </text>
      <text
        class="label"
        x="${x}"
        y="${y + 48}">
        ${t.name}
      </text>
    `;

    nodeGroup.appendChild(g);
  });

  svg.appendChild(nodeGroup);
}

renderAll();
