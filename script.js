const STORAGE_KEY = "rrb_so_study_tracker_v1";
const START = new Date(2026, 10, 1),
  END = new Date(2026, 11, 31);

const DEFAULT_SUBJECTS = [
  {
    id: "quant",
    name: "Quantitative Aptitude",
    category: "Quant",
    chapters: [
      "Simplification and Approximation",
      "Number Series (Missing & Wrong)",
      "Quadratic Equations",
      "Percentage",
      "Ratio and Proportion",
      "Average",
      "Profit, Loss and Discount",
      "Simple and Compound Interest",
      "Partnership",
      "Mixture and Alligation",
      "Problems on Ages",
      "Time and Work",
      "Pipes and Cisterns",
      "Time, Speed and Distance",
      "Boats and Streams",
      "Probability and Permutation & Combination",
      "Data Interpretation (DI)",
    ],
  },
  {
    id: "reasoning",
    name: "Reasoning Ability",
    category: "Reasoning",
    chapters: [
      "Seating Arrangement",
      "Puzzles",
      "Syllogism",
      "Inequality",
      "Coding and Decoding",
      "Blood Relations",
      "Direction and Distance",
      "Order and Ranking",
      "Alphanumeric and Alphabetical Series",
      "Miscellaneous Logical Reasoning (Input-Output, Data Sufficiency, Critical Reasoning)",
    ],
  },
  {
    id: "cs",
    name: "Professional Knowledge – Computer Science / IT",
    category: "Computer Science",
    chapters: [
      "Computer Fundamentals and Number Systems",
      "Programming in C, C++ and Java",
      "Object-Oriented Programming",
      "Data Structures",
      "Algorithms and Complexity",
      "DBMS and Normalization",
      "SQL and Database Queries",
      "Operating Systems",
      "Computer Networks and TCP/IP",
      "Network Security and Cryptography",
      "Cyber Security Fundamentals",
      "Information Security and Access Control",
      "Software Engineering and SDLC",
      "Web Technologies",
      "Computer Architecture and Microprocessors",
      "Cloud Computing and Virtualization",
      "Data Warehousing and Data Mining",
      "Artificial Intelligence and Machine Learning",
      "IT Governance, Risk and Compliance",
      "Banking Technology, Digital Banking and Payment Systems",
    ],
  },
  {
    id: "financial",
    name: "Financial Awareness",
    category: "Financial Awareness",
    chapters: [
      "RBI – Role, Functions and Monetary Policy",
      "Banking Structure in India",
      "Commercial Banks, RRBs and Cooperative Banks",
      "Banking Regulation Act and RBI Act – Basics",
      "NPA, SARFAESI, DRT and Recovery",
      "Priority Sector Lending (PSL)",
      "Financial Inclusion and Government Schemes",
      "Banking Products, Deposits and Loans",
      "Basel Norms and Capital Adequacy",
      "Inflation, GDP, Fiscal and Monetary Policy",
      "Union Budget and Economic Survey",
      "Money Market and Capital Market",
      "SEBI, IRDAI, NABARD and SIDBI",
      "Digital Payments – UPI, IMPS, NEFT, RTGS",
      "NPCI, RuPay, AEPS and BBPS",
      "Financial News and Important Appointments",
      "Reports, Indices, Awards and Current Affairs",
    ],
  },
  {
    id: "english",
    name: "English Language",
    category: "English",
    chapters: [
      "Reading Comprehension",
      "Cloze Test",
      "Error Detection",
      "Sentence Improvement",
      "Para Jumbles",
      "Fill in the Blanks",
      "Phrase Replacement",
      "Vocabulary and Usage",
    ],
  },
  {
    id: "hindi",
    name: "Hindi Language",
    category: "Hindi",
    chapters: [
      "अपठित गद्यांश",
      "व्याकरण",
      "वाक्य शुद्धि",
      "रिक्त स्थान पूर्ति",
      "पर्यायवाची और विलोम शब्द",
      "मुहावरे और लोकोक्तियाँ",
      "अनेक शब्दों के लिए एक शब्द",
      "वाक्य क्रम / पैराग्राफ क्रम",
      "शब्दावली और प्रयोग",
    ],
  },
];

const $ = (s) => document.querySelector(s);

const state = loadState();

let selectedDate = new Date(2026, 10, 1);
let visibleMonth = new Date(2026, 10, 1);
let editTarget = null;
let toastTimer;

function freshState() {
  return {
    subjects: structuredClone(DEFAULT_SUBJECTS),
    days: {},
    theme: "light",
  };
}

function loadState() {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (v && Array.isArray(v.subjects) && v.days) {
      return { ...freshState(), ...v };
    }
  } catch (e) {}

  return freshState();
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayData(d) {
  const k = dateKey(d);

  if (!state.days[k]) {
    state.days[k] = {
      tasks: {},
      hours: "",
      status: "normal",
      notes: "",
    };
  }

  return state.days[k];
}

function fmt(
  d,
  opt = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  },
) {
  return d.toLocaleDateString("en-IN", opt);
}

function sameDay(a, b) {
  return dateKey(a) === dateKey(b);
}

function inRange(d) {
  return d >= START && d <= END;
}

function allTasks() {
  return state.subjects.flatMap((s) =>
    s.chapters.map((c, i) => ({
      subject: s.name,
      subjectId: s.id,
      chapter: c,
      taskId: `${s.id}::${i}`,
    })),
  );
}

function taskCounts(d) {
  const data = dayData(d);
  const tasks = allTasks();

  let study = 0;
  let revision = 0;

  tasks.forEach((t) => {
    const v = data.tasks[t.taskId] || {};

    if (v.study) study++;
    if (v.revision) revision++;
  });

  return {
    study,
    revision,
    total: tasks.length,
    done: study + revision,
    possible: tasks.length * 2,
    pct: tasks.length
      ? Math.round(((study + revision) / (tasks.length * 2)) * 100)
      : 0,
  };
}

function monthDays() {
  const y = visibleMonth.getFullYear();
  const m = visibleMonth.getMonth();

  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);

  const offset = (first.getDay() + 6) % 7;
  const arr = [];

  for (let i = 0; i < offset; i++) {
    arr.push(null);
  }

  for (let d = 1; d <= last.getDate(); d++) {
    arr.push(new Date(y, m, d));
  }

  return arr;
}

function renderCalendar() {
  const grid = $("#daysGrid");
  grid.innerHTML = "";

  ["M", "T", "W", "T", "F", "S", "S"].forEach((x) => {
    const e = document.createElement("div");
    e.className = "weekday";
    e.textContent = x;
    grid.append(e);
  });

  monthDays().forEach((d) => {
    if (!d) {
      const e = document.createElement("div");
      grid.append(e);
      return;
    }

    const b = document.createElement("button");

    b.className =
      "day-cell" +
      (sameDay(d, selectedDate) ? " selected" : "") +
      (inRange(d) ? "" : " muted-day");

    const c = taskCounts(d);

    b.innerHTML = `
      <span class="day-num">${d.getDate()}</span>
      <span class="day-dots">
        <i class="${c.study ? "active" : ""}"></i>
        <i class="${c.revision ? "active" : ""}"></i>
      </span>
      <span class="day-pct">${c.pct}%</span>
    `;

    b.addEventListener("click", () => {
      selectedDate = d;
      renderAll();

      $("#dayPanel").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    grid.append(b);
  });

  $("#monthLabel").textContent = visibleMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const valid = monthDays().filter(Boolean).filter(inRange);

  const done = valid.filter((d) => taskCounts(d).done > 0).length;

  $("#monthSummary").textContent =
    `${valid.length} preparation days · ${done} days with activity · Select a date to update its checklist.`;
}

function renderSubjectFilter() {
  const s = $("#subjectFilter");
  const v = s.value;

  s.innerHTML =
    '<option value="all">All subjects</option>' +
    state.subjects
      .map((x) => `<option value="${x.id}">${escapeHtml(x.name)}</option>`)
      .join("");

  s.value = [...s.options].some((o) => o.value === v) ? v : "all";
}

function renderTasks() {
  const data = dayData(selectedDate);
  const container = $("#taskGroups");

  const q = $("#searchInput").value.trim().toLowerCase();
  const sf = $("#subjectFilter").value;
  const status = $("#statusFilter").value;

  container.innerHTML = "";

  let shown = 0;

  state.subjects
    .filter((s) => sf === "all" || s.id === sf)
    .forEach((s) => {
      const rows = s.chapters
        .map((chapter, i) => ({
          chapter,
          id: `${s.id}::${i}`,
          v: data.tasks[`${s.id}::${i}`] || {},
        }))
        .filter((t) => {
          const text = (s.name + " " + t.chapter).toLowerCase();

          if (q && !text.includes(q)) return false;

          const a = !!t.v.study;
          const b = !!t.v.revision;

          if (status === "pending" && (a || b)) return false;
          if (status === "study" && !a) return false;
          if (status === "revision" && !b) return false;
          if (status === "done" && !(a && b)) return false;

          return true;
        });

      if (!rows.length) return;

      shown += rows.length;

      const group = document.createElement("div");
      group.className = "subject-group";

      group.innerHTML = `
        <div class="subject-title">
          <span>${escapeHtml(s.name)}</span>
          <small>
            ${rows.filter((r) => r.v.study && r.v.revision).length}/${rows.length}
            fully revised
          </small>
        </div>
      `;

      rows.forEach((t) => {
        const row = document.createElement("div");
        row.className = "task-row";

        row.innerHTML = `
          <span class="task-name">${escapeHtml(t.chapter)}</span>

          <label class="task-check">
            <input
              type="checkbox"
              data-task="${escapeAttr(t.id)}"
              data-kind="study"
              ${t.v.study ? "checked" : ""}
            >
            Study
          </label>

          <label class="task-check revision">
            <input
              type="checkbox"
              data-task="${escapeAttr(t.id)}"
              data-kind="revision"
              ${t.v.revision ? "checked" : ""}
            >
            Revision
          </label>
        `;

        group.append(row);
      });

      container.append(group);
    });

  if (!shown) {
    container.innerHTML = `
      <div class="task-empty">
        No matching chapters. Try changing your filters or add a chapter in Customize your syllabus.
      </div>
    `;
  }

  container.querySelectorAll("input[type=checkbox]").forEach((ch) => {
    ch.addEventListener("change", () => {
      const d = dayData(selectedDate);
      const id = ch.dataset.task;

      d.tasks[id] ??= {
        study: false,
        revision: false,
      };

      d.tasks[id][ch.dataset.kind] = ch.checked;

      save();
    });
  });

  const c = taskCounts(selectedDate);

  $("#dayProgressText").textContent = c.pct + "%";
  $("#dayProgressBar").style.width = c.pct + "%";

  $("#selectedDateTitle").textContent = fmt(selectedDate);

  $("#selectedDateSub").textContent =
    `${allTasks().length} chapters · ${c.study} study tasks and ${c.revision} revisions completed`;

  $("#hoursInput").value = data.hours;
  $("#dayStatus").value = data.status;
  $("#dayNotes").value = data.notes;
}

function renderSyllabus() {
  const box = $("#syllabusManager");
  box.innerHTML = "";

  state.subjects.forEach((s) => {
    const wrap = document.createElement("div");
    wrap.className = "syllabus-subject";

    const head = document.createElement("div");
    head.className = "syllabus-head";

    head.innerHTML = `
      <div>
        <strong>${escapeHtml(s.name)}</strong>
        <small>${s.chapters.length} chapters</small>
      </div>

      <div class="syllabus-actions">
        <button class="mini-btn" data-add="${escapeAttr(s.id)}">
          + Chapter
        </button>

        <button class="mini-btn" data-rename="${escapeAttr(s.id)}">
          Rename
        </button>

        <button class="mini-btn" data-delete-sub="${escapeAttr(s.id)}">
          Delete
        </button>
      </div>
    `;

    wrap.append(head);

    const list = document.createElement("div");
    list.className = "chapter-list";

    s.chapters.forEach((c, i) => {
      const r = document.createElement("div");
      r.className = "chapter-item";

      r.innerHTML = `
        <span>${i + 1}. ${escapeHtml(c)}</span>

        <div>
          <button
            class="mini-btn"
            data-edit="${escapeAttr(s.id)}"
            data-index="${i}"
          >
            Edit
          </button>

          <button
            class="mini-btn"
            data-delete="${escapeAttr(s.id)}"
            data-index="${i}"
          >
            ×
          </button>
        </div>
      `;

      list.append(r);
    });

    wrap.append(list);
    box.append(wrap);
  });

  box.querySelectorAll("[data-add]").forEach((b) => {
    b.onclick = () => openEdit(b.dataset.add, null);
  });

  box.querySelectorAll("[data-rename]").forEach((b) => {
    b.onclick = () => {
      const s = state.subjects.find((x) => x.id === b.dataset.rename);
      const n = prompt("Enter subject name:", s.name);

      if (n && n.trim()) {
        s.name = n.trim();
        save();
      }
    };
  });

  box.querySelectorAll("[data-delete-sub]").forEach((b) => {
    b.onclick = () => {
      const s = state.subjects.find((x) => x.id === b.dataset.deleteSub);

      if (
        confirm(
          `Delete "${s.name}" and its chapters from the syllabus? Existing historical ticks for this subject will no longer count.`,
        )
      ) {
        state.subjects = state.subjects.filter((x) => x.id !== s.id);
        save();
      }
    };
  });

  box.querySelectorAll("[data-edit]").forEach((b) => {
    b.onclick = () => openEdit(b.dataset.edit, +b.dataset.index);
  });

  box.querySelectorAll("[data-delete]").forEach((b) => {
    b.onclick = () => {
      const s = state.subjects.find((x) => x.id === b.dataset.delete);

      if (confirm(`Delete chapter "${s.chapters[+b.dataset.index]}"?`)) {
        s.chapters.splice(+b.dataset.index, 1);
        save();
      }
    };
  });
}

function renderStats() {
  let sd = 0;
  let rd = 0;
  let tot = 0;
  let hours = 0;
  let tracked = 0;

  const tasks = allTasks();

  for (let d = new Date(START); d <= END; d.setDate(d.getDate() + 1)) {
    const data = state.days[dateKey(d)];

    if (!data) continue;

    let active = false;

    tasks.forEach((t) => {
      const v = data.tasks[t.taskId] || {};

      if (v.study) {
        sd++;
        active = true;
      }

      if (v.revision) {
        rd++;
        active = true;
      }
    });

    hours += Number(data.hours) || 0;

    if (active || data.notes || Number(data.hours) > 0) {
      tracked++;
    }
  }

  tot = tasks.length * 61 * 2;

  const pct = tot ? Math.round(((sd + rd) / tot) * 100) : 0;

  $("#studyDone").textContent = sd;
  $("#studyTotal").textContent = `of ${tasks.length * 61}`;

  $("#revisionDone").textContent = rd;
  $("#revisionTotal").textContent = `of ${tasks.length * 61}`;

  $("#totalHours").textContent = hours + "h";
  $("#daysTracked").textContent = tracked;

  $("#overallPercent").textContent = pct + "%";

  $("#overallRing").style.background =
    `conic-gradient(#a89cff ${pct * 3.6}deg,#ffffff25 0deg)`;
}

function renderAll() {
  renderSubjectFilter();
  renderCalendar();
  renderTasks();
  renderSyllabus();

  renderStats();

  document.body.classList.toggle("dark", state.theme === "dark");
}

function openEdit(subjectId, index) {
  editTarget = {
    subjectId,
    index,
  };

  const s = state.subjects.find((x) => x.id === subjectId);

  $("#dialogTitle").textContent =
    index === null ? "Add chapter" : "Edit chapter";

  $("#editSubject").value = s.name;

  $("#editChapter").value = index === null ? "" : s.chapters[index];

  $("#editCategory").innerHTML = [
    ...new Set(state.subjects.map((x) => x.category || x.name)),
  ]
    .map((x) => `<option>${escapeHtml(x)}</option>`)
    .join("");

  $("#editCategory").value = s.category || s.name;

  $("#editDialog").showModal();
}

function toast(msg) {
  const t = $("#toast");

  t.textContent = msg;
  t.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

function escapeAttr(s) {
  return escapeHtml(s);
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "study-tracker-backup-" + dateKey(new Date()) + ".json";

  a.click();

  URL.revokeObjectURL(url);

  toast("Backup exported successfully");
}

// Edit existing chapter or add a new chapter
$("#editForm").addEventListener("submit", (e) => {
  if (e.submitter?.id !== "saveEditBtn") return;

  e.preventDefault();

  const s = state.subjects.find((x) => x.id === editTarget.subjectId);

  const newName = $("#editSubject").value.trim();
  const chapter = $("#editChapter").value.trim();

  if (!newName || !chapter) return;

  s.name = newName;
  s.category = $("#editCategory").value;

  if (editTarget.index === null) {
    s.chapters.push(chapter);
  } else {
    s.chapters[editTarget.index] = chapter;
  }

  $("#editDialog").close();

  save();
  toast("Syllabus updated");
});

// Add a new subject
$("#subjectForm").addEventListener("submit", (e) => {
  if (e.submitter?.id !== "createSubjectBtn") return;

  e.preventDefault();

  const name = $("#newSubjectName").value.trim();

  if (!name) return;

  const id = "custom_" + Date.now();

  const chapters = $("#newSubjectChapters")
    .value.split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  state.subjects.push({
    id,
    name,
    category: name,
    chapters,
  });

  $("#subjectDialog").close();
  $("#subjectForm").reset();

  save();
  toast("Subject added");
});

// Open add subject dialog
$("#addSubjectBtn").onclick = () => {
  $("#subjectDialog").showModal();
};

// Previous month
$("#prevMonth").onclick = () => {
  const d = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() - 1,
    1,
  );

  if (d >= new Date(2026, 10, 1)) {
    visibleMonth = d;
  }

  renderAll();
};

// Next month
$("#nextMonth").onclick = () => {
  const d = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    1,
  );

  if (d <= new Date(2026, 11, 1)) {
    visibleMonth = d;
  }

  renderAll();
};

// Go to today's date
$("#todayBtn").onclick = () => {
  const now = new Date();

  if (!inRange(now)) {
    toast("This tracker covers 1 Nov – 31 Dec 2026");
    return;
  }

  selectedDate = now;
  visibleMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  renderAll();

  $("#dayPanel").scrollIntoView({
    behavior: "smooth",
  });
};

// Search and filters
$("#searchInput").oninput = renderTasks;
$("#subjectFilter").onchange = renderTasks;
$("#statusFilter").onchange = renderTasks;

// Daily study hours
$("#hoursInput").onchange = (e) => {
  dayData(selectedDate).hours = e.target.value;
  save();
};

// Daily status
$("#dayStatus").onchange = (e) => {
  dayData(selectedDate).status = e.target.value;
  save();
};

// Daily notes
$("#dayNotes").onchange = (e) => {
  dayData(selectedDate).notes = e.target.value;
  save();
  toast("Notes saved");
};

// Clear selected day's progress
$("#clearDayBtn").onclick = () => {
  if (
    confirm(
      "Clear all study ticks, revision ticks, hours and notes for this date?",
    )
  ) {
    state.days[dateKey(selectedDate)] = {
      tasks: {},
      hours: "",
      status: "normal",
      notes: "",
    };

    save();
    toast("This day has been cleared");
  }
};

// Mark all chapters as studied for selected day
$("#markDayBtn").onclick = () => {
  const d = dayData(selectedDate);

  allTasks().forEach((t) => {
    d.tasks[t.taskId] ??= {
      study: false,
      revision: false,
    };

    d.tasks[t.taskId].study = true;
  });

  save();
  toast("All chapters marked as studied");
};

// Reset all progress and customizations
$("#resetAllBtn").onclick = () => {
  if (
    confirm(
      "This will permanently clear all progress, notes and syllabus customizations in this browser. Continue?",
    )
  ) {
    const fresh = freshState();

    state.subjects = fresh.subjects;
    state.days = {};
    state.theme = "light";

    save();
    toast("Tracker reset");
  }
};

// Export backup
$("#exportBtn").onclick = exportData;

// Import backup
$("#importBtn").onclick = () => {
  $("#importFile").click();
};

$("#importFile").onchange = async (e) => {
  const f = e.target.files[0];

  if (!f) return;

  try {
    const v = JSON.parse(await f.text());

    if (!Array.isArray(v.subjects) || !v.days) {
      throw Error();
    }

    if (
      confirm("Import this backup? It will replace the current tracker data.")
    ) {
      state.subjects = v.subjects;
      state.days = v.days;
      state.theme = v.theme || "light";

      save();
      toast("Backup imported");
    }
  } catch (err) {
    alert("This file is not a valid Study Tracker backup.");
  }

  e.target.value = "";
};

// Light and dark theme
$("#themeBtn").onclick = () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  save();
};

// Initial page rendering
renderAll();
