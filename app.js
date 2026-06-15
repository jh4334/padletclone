const LOCAL_PREF_KEY = "boardly-local-prefs-v1";
const LOCAL_PROFILE_KEY = "boardly-local-profile-v1";
const LOCAL_STATE_PREFIX = "boardly-local-state-";
const LEGACY_STATE_PREFIX = "boardly-board-snapshot-";
const ATTACHMENT_DB = "boardly-local-attachments";
const ATTACHMENT_STORE = "files";
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const FORBIDDEN_TERMS = ["spam", "hate", "욕설", "광고도배"];

const STATUSES = ["new", "discussing", "blocked", "decided", "archived"];
const STATUS_LABELS = {
  new: "New",
  discussing: "Discussing",
  blocked: "Blocked",
  decided: "Decided",
  archived: "Archived",
  pending: "Review",
};

const TYPE_LABELS = {
  idea: "Idea",
  question: "Question",
  resource: "Resource",
  decision: "Decision",
};

const PRIORITY_SCORE = { P1: 3, P2: 2, P3: 1 };
const CANVAS_CARD_WIDTH = 306;
const CANVAS_CARD_HEIGHT = 190;
const CANVAS_CARD_GAP = 24;
const CANVAS_START_X = 30;
const CANVAS_START_Y = 30;

const seedPosts = [
  {
    id: crypto.randomUUID(),
    title: "이번 주 작업 정리",
    content: "흩어진 할 일과 아이디어를 카드로 모으고, 진행 상태와 결정 사항을 한 화면에서 관리합니다.",
    tags: ["업무정리", "할일"],
    section: "Inbox",
    type: "question",
    priority: "P1",
    status: "discussing",
    moderationStatus: "live",
    evidenceUrl: "",
    attachments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    x: 80,
    y: 70,
    reactions: { like: 2, insight: 2, risk: 1 },
    comments: [{ id: crypto.randomUUID(), authorName: "팀원", text: "먼저 오늘 처리할 것과 나중에 볼 것을 나누면 좋겠습니다." }],
    authorName: "팀원",
  },
  {
    id: crypto.randomUUID(),
    title: "로컬 우선 저장 방식 채택",
    content: "외부 DB 없이 브라우저 저장소에 카드와 자료를 보관하고, 백업 파일로 이동성을 확보합니다.",
    tags: ["결정", "로컬저장"],
    section: "Decision",
    type: "decision",
    priority: "P1",
    status: "decided",
    moderationStatus: "live",
    evidenceUrl: "",
    attachments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    x: 420,
    y: 150,
    reactions: { like: 3, insight: 1, risk: 0 },
    comments: [{ id: crypto.randomUUID(), authorName: "팀원", text: "다른 기기로 옮길 때도 데이터가 유지됩니다." }],
    authorName: "팀원",
  },
];

const defaultSharedState = {
  boardTitle: "내 작업 협업 보드",
  layout: "canvas",
  sections: ["All", "Inbox", "Idea", "Decision"],
  posts: seedPosts,
};

const defaultPrefs = {
  activeSection: "All",
  query: "",
  sort: "recent",
  hideArchived: true,
};

const boardId = getBoardIdFromUrl();
const profile = loadProfile();

const els = {
  layoutOptions: document.querySelectorAll(".layout-option"),
  searchInput: document.getElementById("searchInput"),
  sortSelect: document.getElementById("sortSelect"),
  hideArchivedInput: document.getElementById("hideArchivedInput"),
  copyLinkBtn: document.getElementById("copyLinkBtn"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  exportBackupBtn: document.getElementById("exportBackupBtn"),
  importBackupInput: document.getElementById("importBackupInput"),
  resetDemoBtn: document.getElementById("resetDemoBtn"),
  titleInput: document.getElementById("titleInput"),
  contentInput: document.getElementById("contentInput"),
  tagsInput: document.getElementById("tagsInput"),
  typeInput: document.getElementById("typeInput"),
  statusInput: document.getElementById("statusInput"),
  priorityInput: document.getElementById("priorityInput"),
  evidenceInput: document.getElementById("evidenceInput"),
  attachmentInput: document.getElementById("attachmentInput"),
  attachmentHint: document.getElementById("attachmentHint"),
  sectionInput: document.getElementById("sectionInput"),
  addPostBtn: document.getElementById("addPostBtn"),
  newSectionInput: document.getElementById("newSectionInput"),
  addSectionBtn: document.getElementById("addSectionBtn"),
  decisionList: document.getElementById("decisionList"),
  board: document.getElementById("board"),
  sectionTabs: document.getElementById("sectionTabs"),
  boardSubtitle: document.getElementById("boardSubtitle"),
  statsStrip: document.getElementById("statsStrip"),
  postTemplate: document.getElementById("postTemplate"),
  boardIdInput: document.getElementById("boardIdInput"),
  displayNameInput: document.getElementById("displayNameInput"),
  syncStatus: document.getElementById("syncStatus"),
  storageStatus: document.getElementById("storageStatus"),
  storagePosts: document.getElementById("storagePosts"),
  storageAttachments: document.getElementById("storageAttachments"),
  storageDecisions: document.getElementById("storageDecisions"),
};

let shared = normalizeSharedState(loadBoardSnapshot());
let prefs = loadPrefs();
let drag = { id: null, offsetX: 0, offsetY: 0 };
let attachmentDbPromise = null;

function getBoardIdFromUrl() {
  const url = new URL(window.location.href);
  const id = (url.searchParams.get("board") || "my-workspace").trim();
  return id.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 48) || "my-workspace";
}

function stateKey() {
  return `${LOCAL_STATE_PREFIX}${boardId}`;
}

function legacyStateKey() {
  return `${LEGACY_STATE_PREFIX}${boardId}`;
}

function normalizeSections(sections) {
  const list = Array.isArray(sections) ? sections.filter(Boolean) : [];
  if (!list.includes("All")) list.unshift("All");
  return Array.from(new Set(list));
}

function normalizeLayout(layout) {
  if (layout === "freeform") return "canvas";
  if (layout === "stream") return "workflow";
  if (["canvas", "workflow", "timeline", "focus"].includes(layout)) return layout;
  return "canvas";
}

function normalizeComment(comment) {
  if (typeof comment === "string") {
    return { id: crypto.randomUUID(), authorName: "익명", text: comment, createdAt: new Date().toISOString() };
  }
  return {
    id: comment.id || crypto.randomUUID(),
    authorName: comment.authorName || "익명",
    text: comment.text || "",
    createdAt: comment.createdAt || new Date().toISOString(),
  };
}

function normalizeAttachment(attachment) {
  if (!attachment || typeof attachment !== "object") return null;
  const id = attachment.id || crypto.randomUUID();
  return {
    id,
    name: attachment.name || attachment.fileName || "첨부 자료",
    size: Number.isFinite(attachment.size) ? attachment.size : 0,
    type: attachment.type || attachment.mimeType || "application/octet-stream",
    uploadedAt: attachment.uploadedAt || new Date().toISOString(),
  };
}

function normalizePost(post, index) {
  const legacyPending = post.status === "pending";
  const status = STATUSES.includes(post.status) ? post.status : legacyPending ? "new" : "new";
  const moderationStatus = legacyPending ? "pending" : post.moderationStatus || "live";

  return {
    id: post.id || crypto.randomUUID(),
    title: post.title || "제목 없음",
    content: post.content || "",
    tags: Array.isArray(post.tags) ? post.tags : [],
    section: post.section || "Inbox",
    type: TYPE_LABELS[post.type] ? post.type : "idea",
    priority: PRIORITY_SCORE[post.priority] ? post.priority : "P2",
    status,
    moderationStatus,
    evidenceUrl: post.evidenceUrl || "",
    attachments: Array.isArray(post.attachments) ? post.attachments.map(normalizeAttachment).filter(Boolean) : [],
    createdAt: post.createdAt || new Date().toISOString(),
    x: Number.isFinite(post.x) ? post.x : 40 + index * 28,
    y: Number.isFinite(post.y) ? post.y : 40 + index * 28,
    reactions: {
      like: post.reactions?.like || 0,
      insight: post.reactions?.insight || 0,
      risk: post.reactions?.risk || post.reactions?.fire || 0,
    },
    comments: Array.isArray(post.comments) ? post.comments.map(normalizeComment) : [],
    authorName: post.authorName || "익명 팀원",
  };
}

function normalizeSharedState(value) {
  const merged = {
    ...structuredClone(defaultSharedState),
    ...value,
    layout: normalizeLayout(value?.layout),
    sections: normalizeSections(value?.sections),
    posts: Array.isArray(value?.posts) ? value.posts.map(normalizePost) : structuredClone(seedPosts),
  };

  for (const post of merged.posts) {
    if (!merged.sections.includes(post.section)) merged.sections.push(post.section);
  }

  return merged;
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed?.id && parsed?.name) return parsed;
  } catch {
  }

  const fallback = {
    id: crypto.randomUUID(),
    name: `팀원-${Math.floor(Math.random() * 900 + 100)}`,
  };
  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(fallback));
  return fallback;
}

function persistProfile() {
  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(LOCAL_PREF_KEY);
    if (!raw) return structuredClone(defaultPrefs);
    return { ...structuredClone(defaultPrefs), ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultPrefs);
  }
}

function persistPrefs() {
  localStorage.setItem(LOCAL_PREF_KEY, JSON.stringify(prefs));
}

function loadBoardSnapshot() {
  try {
    const raw = localStorage.getItem(stateKey()) || localStorage.getItem(legacyStateKey());
    return raw ? JSON.parse(raw) : structuredClone(defaultSharedState);
  } catch {
    return structuredClone(defaultSharedState);
  }
}

function persistBoardSnapshot() {
  try {
    localStorage.setItem(stateKey(), JSON.stringify(shared));
    updateSaveStatus("Local saved");
  } catch {
    updateSaveStatus("Storage full");
  }
}

function updateSaveStatus(text) {
  els.syncStatus.textContent = text;
}

function parseTags(raw) {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function hasForbiddenTerm(text) {
  const lowered = text.toLowerCase();
  return FORBIDDEN_TERMS.some((term) => lowered.includes(term));
}

function reactionTotal(post) {
  return (post.reactions.like || 0) + (post.reactions.insight || 0) + (post.reactions.risk || 0);
}

function filteredPosts() {
  const q = prefs.query.trim().toLowerCase();
  return shared.posts
    .filter((post) => prefs.activeSection === "All" || post.section === prefs.activeSection)
    .filter((post) => !prefs.hideArchived || post.status !== "archived")
    .filter((post) => {
      if (!q) return true;
      return [post.title, post.content, post.authorName, post.status, post.priority, post.type, post.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(q);
    })
    .sort(sortPosts);
}

function sortPosts(a, b) {
  if (prefs.sort === "priority") return PRIORITY_SCORE[b.priority] - PRIORITY_SCORE[a.priority] || newestFirst(a, b);
  if (prefs.sort === "status") return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || newestFirst(a, b);
  if (prefs.sort === "reactions") return reactionTotal(b) - reactionTotal(a) || newestFirst(a, b);
  return newestFirst(a, b);
}

function newestFirst(a, b) {
  return new Date(b.createdAt) - new Date(a.createdAt);
}

function openAttachmentDb() {
  if (!("indexedDB" in window)) return Promise.reject(new Error("IndexedDB를 사용할 수 없습니다."));
  if (attachmentDbPromise) return attachmentDbPromise;

  attachmentDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(ATTACHMENT_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ATTACHMENT_STORE)) {
        db.createObjectStore(ATTACHMENT_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return attachmentDbPromise;
}

async function putAttachment(id, file) {
  const db = await openAttachmentDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ATTACHMENT_STORE, "readwrite");
    tx.objectStore(ATTACHMENT_STORE).put({ id, blob: file });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAttachment(id) {
  const db = await openAttachmentDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ATTACHMENT_STORE, "readonly");
    const request = tx.objectStore(ATTACHMENT_STORE).get(id);
    request.onsuccess = () => resolve(request.result?.blob || null);
    request.onerror = () => reject(request.error);
  });
}

async function deleteAttachment(id) {
  const db = await openAttachmentDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ATTACHMENT_STORE, "readwrite");
    tx.objectStore(ATTACHMENT_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function renderAttachmentLink(attachment, container) {
  const link = document.createElement("a");
  link.className = "attachment-link locked";
  link.href = "#";
  link.textContent = `${attachment.name}${attachment.size ? ` · ${formatBytes(attachment.size)}` : ""}`;
  link.addEventListener("click", (event) => event.preventDefault());
  container.appendChild(link);

  try {
    const blob = await getAttachment(attachment.id);
    if (!blob) {
      link.textContent = `${attachment.name} · 파일 없음`;
      return;
    }

    link.href = URL.createObjectURL(blob);
    link.target = "_blank";
    link.rel = "noreferrer";
    link.download = attachment.name;
    link.classList.remove("locked");
  } catch {
    link.textContent = `${attachment.name} · 열기 실패`;
  }
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function renderSectionInputs() {
  els.sectionInput.innerHTML = "";
  shared.sections
    .filter((section) => section !== "All")
    .forEach((section) => {
      const option = document.createElement("option");
      option.value = section;
      option.textContent = section;
      els.sectionInput.appendChild(option);
    });

  if (!els.sectionInput.value) {
    els.sectionInput.value = shared.sections.find((section) => section !== "All") || "Inbox";
  }
}

function renderSectionTabs() {
  els.sectionTabs.innerHTML = "";
  shared.sections.forEach((section) => {
    const btn = document.createElement("button");
    btn.className = `section-tab ${section === prefs.activeSection ? "active" : ""}`;
    btn.textContent = section;
    btn.type = "button";
    btn.addEventListener("click", () => {
      prefs.activeSection = section;
      persistPrefs();
      render();
    });
    els.sectionTabs.appendChild(btn);
  });
}

function renderStats() {
  const posts = shared.posts;
  const livePosts = posts.filter((post) => post.moderationStatus !== "pending");
  const attachmentCount = posts.reduce((total, post) => total + post.attachments.length, 0);
  const stats = [
    ["전체", posts.length],
    ["논의 중", livePosts.filter((post) => post.status === "discussing").length],
    ["결정", livePosts.filter((post) => post.status === "decided").length],
    ["막힘", livePosts.filter((post) => post.status === "blocked").length],
    ["첨부/근거", livePosts.filter((post) => post.evidenceUrl || post.attachments.length > 0).length],
  ];

  els.statsStrip.innerHTML = "";
  stats.forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "stat-card";
    item.innerHTML = `<strong>${value}</strong><span>${label}</span>`;
    els.statsStrip.appendChild(item);
  });

  els.storagePosts.textContent = String(posts.length);
  els.storageAttachments.textContent = String(attachmentCount);
  els.storageDecisions.textContent = String(posts.filter((post) => post.status === "decided").length);
}

function renderDecisionList() {
  const decisions = shared.posts
    .filter((post) => post.status === "decided" || post.type === "decision")
    .sort(newestFirst)
    .slice(0, 8);

  els.decisionList.innerHTML = "";
  if (decisions.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "아직 결정 기록이 없습니다.";
    els.decisionList.appendChild(empty);
    return;
  }

  decisions.forEach((post) => {
    const item = document.createElement("div");
    item.className = "decision-item";
    const title = document.createElement("strong");
    title.textContent = post.title;
    const meta = document.createElement("span");
    meta.textContent = `${post.priority} · ${post.section} · ${new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(post.createdAt))}`;
    item.append(title, meta);
    els.decisionList.appendChild(item);
  });
}

function getCardKicker(post) {
  return `${TYPE_LABELS[post.type]} · ${post.priority} · ${post.section}`;
}

function renderAttachments(post, container) {
  container.innerHTML = "";
  post.attachments.forEach((attachment) => {
    void renderAttachmentLink(attachment, container);
  });
}

function renderPostCard(post) {
  const fragment = els.postTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".post-card");
  const titleEl = fragment.querySelector(".post-title");
  const contentEl = fragment.querySelector(".post-content");
  const statusBadge = fragment.querySelector(".status-badge");
  const kickerEl = fragment.querySelector(".card-kicker");
  const tagList = fragment.querySelector(".tag-list");
  const evidenceLink = fragment.querySelector(".evidence-link");
  const attachmentList = fragment.querySelector(".attachment-list");
  const timeEl = fragment.querySelector("time");
  const authorEl = fragment.querySelector(".author");
  const commentCount = fragment.querySelector(".comment-count");
  const commentList = fragment.querySelector(".comment-list");
  const commentInput = fragment.querySelector(".comment-form input");
  const commentBtn = fragment.querySelector(".comment-form button");
  const statusSelect = fragment.querySelector(".card-status-select");
  const deleteBtn = fragment.querySelector(".card-delete-btn");

  card.dataset.id = post.id;
  card.draggable = shared.layout === "canvas";
  titleEl.textContent = post.title;
  contentEl.textContent = post.content;
  kickerEl.textContent = getCardKicker(post);
  authorEl.textContent = post.authorName || "익명 팀원";

  const badgeStatus = post.moderationStatus === "pending" ? "pending" : post.status;
  statusBadge.textContent = STATUS_LABELS[badgeStatus] || badgeStatus;
  statusBadge.classList.add(`status-${badgeStatus}`);
  statusSelect.value = post.status;

  timeEl.textContent = new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(post.createdAt));

  if (shared.layout === "canvas") {
    card.style.left = `${post.x ?? 20}px`;
    card.style.top = `${post.y ?? 20}px`;
  }

  if (post.evidenceUrl) {
    evidenceLink.href = post.evidenceUrl;
    evidenceLink.textContent = "근거 열기";
    evidenceLink.classList.add("visible");
  }

  renderAttachments(post, attachmentList);

  const priorityChip = document.createElement("span");
  priorityChip.className = `priority-chip ${post.priority}`;
  priorityChip.textContent = post.priority;
  tagList.appendChild(priorityChip);

  post.tags.forEach((tag) => {
    const chip = document.createElement("span");
    chip.className = "tag";
    chip.textContent = `#${tag}`;
    tagList.appendChild(chip);
  });

  commentCount.textContent = String(post.comments.length);
  post.comments.forEach((comment) => {
    const li = document.createElement("li");
    li.textContent = `${comment.authorName || "익명"}: ${comment.text}`;
    commentList.appendChild(li);
  });

  fragment.querySelectorAll(".reaction-row button").forEach((btn) => {
    const key = btn.dataset.reaction;
    btn.querySelector("span").textContent = String(post.reactions[key] || 0);
    btn.addEventListener("click", () => {
      post.reactions[key] = (post.reactions[key] || 0) + 1;
      persistAndRender();
    });
  });

  commentBtn.addEventListener("click", () => {
    const value = commentInput.value.trim();
    if (!value) return;
    post.comments.push({
      id: crypto.randomUUID(),
      authorName: profile.name,
      text: value,
      createdAt: new Date().toISOString(),
    });
    persistAndRender();
  });

  statusSelect.addEventListener("change", (event) => {
    post.status = event.target.value;
    persistAndRender();
  });

  deleteBtn.addEventListener("click", () => {
    void deletePost(post.id);
  });

  return card;
}

function appendBoardEmptyState(message) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  els.board.appendChild(empty);
}

function renderBoard() {
  const posts = filteredPosts();
  els.board.className = `board ${shared.layout}`;
  els.board.innerHTML = "";

  if (posts.length === 0) {
    appendBoardEmptyState("조건에 맞는 카드가 없습니다.");
    return;
  }

  if (shared.layout === "workflow") {
    renderWorkflow(posts);
    return;
  }

  const visiblePosts = shared.layout === "focus"
    ? posts.filter((post) => post.priority === "P1" || post.status === "blocked" || post.status === "decided")
    : posts;

  if (visiblePosts.length === 0) {
    appendBoardEmptyState("Focus에 표시할 카드가 없습니다. 우선순위 P1, 막힘, 결정 카드만 보여줍니다.");
    return;
  }

  visiblePosts.forEach((post, index) => {
    const card = renderPostCard(post);
    if (shared.layout !== "canvas") card.style.order = String(index);
    els.board.appendChild(card);
  });
}

function renderWorkflow(posts) {
  STATUSES.forEach((status) => {
    const column = document.createElement("section");
    column.className = "workflow-column";
    const title = document.createElement("h3");
    title.textContent = `${STATUS_LABELS[status]} (${posts.filter((post) => post.status === status).length})`;
    column.appendChild(title);

    posts
      .filter((post) => post.status === status)
      .forEach((post) => column.appendChild(renderPostCard(post)));

    els.board.appendChild(column);
  });
}

function renderControls() {
  els.boardSubtitle.textContent = `${shared.boardTitle} · ${filteredPosts().length}개 표시`;
  els.searchInput.value = prefs.query;
  els.sortSelect.value = prefs.sort;
  els.hideArchivedInput.checked = prefs.hideArchived;
  els.boardIdInput.value = boardId;
  els.displayNameInput.value = profile.name;
  els.storageStatus.textContent = "이 기기 브라우저에 저장됨";

  els.layoutOptions.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.layout === shared.layout);
  });
}

function render() {
  renderSectionInputs();
  renderSectionTabs();
  renderStats();
  renderDecisionList();
  renderBoard();
  renderControls();
}

function persistAndRender() {
  persistBoardSnapshot();
  render();
}

async function addPost() {
  const title = els.titleInput.value.trim();
  const content = els.contentInput.value.trim();
  const section = els.sectionInput.value;
  const tags = parseTags(els.tagsInput.value);
  const evidenceUrl = els.evidenceInput.value.trim();
  const attachmentFile = els.attachmentInput.files[0] || null;

  if (!title || !content) {
    alert("제목과 내용을 입력하세요.");
    return;
  }

  const attachments = [];
  if (attachmentFile) {
    if (attachmentFile.size > MAX_ATTACHMENT_BYTES) {
      alert("첨부 파일은 10MB 이하만 저장할 수 있습니다.");
      return;
    }

    try {
      els.addPostBtn.disabled = true;
      els.addPostBtn.textContent = "저장 중";
      const attachment = await createLocalAttachment(attachmentFile);
      attachments.push(attachment);
    } catch (error) {
      alert(`첨부 저장 실패: ${error.message}`);
      els.addPostBtn.disabled = false;
      els.addPostBtn.textContent = "카드 추가";
      return;
    }
  }

  const isPending = hasForbiddenTerm(`${title} ${content}`);
  const position = getNextCanvasPosition();
  shared.posts.push({
    id: crypto.randomUUID(),
    title,
    content,
    tags,
    section,
    type: els.typeInput.value,
    priority: els.priorityInput.value,
    status: els.statusInput.value,
    moderationStatus: isPending ? "pending" : "live",
    evidenceUrl,
    attachments,
    createdAt: new Date().toISOString(),
    x: position.x,
    y: position.y,
    reactions: { like: 0, insight: 0, risk: 0 },
    comments: [],
    authorName: profile.name,
  });

  els.titleInput.value = "";
  els.contentInput.value = "";
  els.tagsInput.value = "";
  els.evidenceInput.value = "";
  els.attachmentInput.value = "";
  els.addPostBtn.disabled = false;
  els.addPostBtn.textContent = "카드 추가";
  persistAndRender();
}

function getNextCanvasPosition() {
  const stepX = CANVAS_CARD_WIDTH + CANVAS_CARD_GAP;
  const stepY = CANVAS_CARD_HEIGHT + CANVAS_CARD_GAP;
  const boardWidth = Math.max(els.board?.clientWidth || 1120, stepX + CANVAS_START_X);
  const columns = Math.max(1, Math.floor((boardWidth - CANVAS_START_X) / stepX));

  for (let index = 0; index < 120; index += 1) {
    const candidate = {
      x: CANVAS_START_X + (index % columns) * stepX,
      y: CANVAS_START_Y + Math.floor(index / columns) * stepY,
    };
    if (!shared.posts.some((post) => canvasCardsOverlap(candidate, post))) return candidate;
  }

  return {
    x: CANVAS_START_X,
    y: CANVAS_START_Y + shared.posts.length * stepY,
  };
}

function canvasCardsOverlap(a, b) {
  return Math.abs((a.x ?? 0) - (b.x ?? 0)) < CANVAS_CARD_WIDTH
    && Math.abs((a.y ?? 0) - (b.y ?? 0)) < CANVAS_CARD_HEIGHT;
}

async function createLocalAttachment(file) {
  const attachment = {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    uploadedAt: new Date().toISOString(),
  };
  await putAttachment(attachment.id, file);
  return attachment;
}

function addSection() {
  const nextSection = els.newSectionInput.value.trim();
  if (!nextSection) return;
  if (shared.sections.includes(nextSection)) {
    alert("이미 존재하는 섹션입니다.");
    return;
  }

  shared.sections.push(nextSection);
  els.newSectionInput.value = "";
  persistAndRender();
}

async function copyShareLink() {
  const link = `${location.origin}${location.pathname}?board=${encodeURIComponent(boardId)}`;
  try {
    await navigator.clipboard.writeText(link);
    alert("현재 보드 링크를 복사했습니다. 데이터는 이 브라우저 안에만 있습니다.");
  } catch {
    alert(`복사 실패. 수동으로 복사하세요: ${link}`);
  }
}

function exportCsv() {
  const rows = [
    ["id", "title", "type", "status", "priority", "section", "author", "tags", "reactions", "comments", "attachments", "evidenceUrl", "createdAt"],
    ...shared.posts.map((post) => [
      post.id,
      post.title,
      TYPE_LABELS[post.type],
      STATUS_LABELS[post.status],
      post.priority,
      post.section,
      post.authorName,
      post.tags.join("|"),
      reactionTotal(post),
      post.comments.length,
      post.attachments.map((attachment) => attachment.name).join("|"),
      post.evidenceUrl,
      post.createdAt,
    ]),
  ];

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  downloadText(`boardly-${boardId}-${Date.now()}.csv`, csv, "text/csv;charset=utf-8");
}

async function exportBackup() {
  const attachments = [];
  for (const attachment of collectAttachments()) {
    const blob = await getAttachment(attachment.id).catch(() => null);
    if (!blob) continue;
    attachments.push({
      ...attachment,
      dataUrl: await blobToDataUrl(blob),
    });
  }

  const backup = {
    app: "boardly-local",
    version: 1,
    boardId,
    exportedAt: new Date().toISOString(),
    shared,
    prefs,
    profile,
    attachments,
  };

  downloadText(`boardly-backup-${boardId}-${Date.now()}.json`, JSON.stringify(backup, null, 2), "application/json");
}

function collectAttachments() {
  const map = new Map();
  shared.posts.forEach((post) => {
    post.attachments.forEach((attachment) => map.set(attachment.id, attachment));
  });
  return [...map.values()];
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] || "application/octet-stream";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function importBackup(file) {
  try {
    const text = await file.text();
    const backup = JSON.parse(text);
    if (!backup?.shared?.posts) throw new Error("Boardly 백업 파일이 아닙니다.");

    shared = normalizeSharedState(backup.shared);
    prefs = { ...structuredClone(defaultPrefs), ...(backup.prefs || {}) };
    if (backup.profile?.name) {
      profile.name = backup.profile.name;
      persistProfile();
    }

    if (Array.isArray(backup.attachments)) {
      for (const attachment of backup.attachments) {
        if (attachment.id && attachment.dataUrl) {
          await putAttachment(attachment.id, dataUrlToBlob(attachment.dataUrl));
        }
      }
    }

    persistPrefs();
    persistAndRender();
    alert("백업을 불러왔습니다.");
  } catch (error) {
    alert(`백업 불러오기 실패: ${error.message}`);
  } finally {
    els.importBackupInput.value = "";
  }
}

async function resetDemo() {
  const ok = confirm("현재 로컬 보드 데이터를 데모 상태로 초기화할까요?");
  if (!ok) return;

  const attachments = collectAttachments();
  for (const attachment of attachments) {
    await deleteAttachment(attachment.id).catch(() => {});
  }

  shared = normalizeSharedState(structuredClone(defaultSharedState));
  prefs = structuredClone(defaultPrefs);
  persistPrefs();
  persistAndRender();
}

async function deletePost(postId) {
  const post = shared.posts.find((item) => item.id === postId);
  if (!post) return;

  const ok = confirm(`"${post.title}" 카드를 삭제할까요? 첨부 파일도 이 브라우저에서 삭제됩니다.`);
  if (!ok) return;

  for (const attachment of post.attachments) {
    await deleteAttachment(attachment.id).catch(() => {});
  }

  shared.posts = shared.posts.filter((item) => item.id !== postId);
  persistAndRender();
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function setupDnD() {
  els.board.addEventListener("dragstart", (event) => {
    if (shared.layout !== "canvas") return;
    const card = event.target.closest(".post-card");
    if (!card) return;
    drag.id = card.dataset.id;

    const rect = card.getBoundingClientRect();
    drag.offsetX = event.clientX - rect.left;
    drag.offsetY = event.clientY - rect.top;
    event.dataTransfer.effectAllowed = "move";
  });

  els.board.addEventListener("dragover", (event) => {
    if (shared.layout !== "canvas") return;
    event.preventDefault();
  });

  els.board.addEventListener("drop", (event) => {
    if (shared.layout !== "canvas") return;
    event.preventDefault();
    if (!drag.id) return;

    const boardRect = els.board.getBoundingClientRect();
    const post = shared.posts.find((item) => item.id === drag.id);
    if (!post) return;

    post.x = Math.max(0, event.clientX - boardRect.left - drag.offsetX);
    post.y = Math.max(0, event.clientY - boardRect.top - drag.offsetY);
    drag.id = null;
    persistAndRender();
  });
}

function setupEvents() {
  els.addPostBtn.addEventListener("click", () => void addPost());
  els.addSectionBtn.addEventListener("click", addSection);
  els.copyLinkBtn.addEventListener("click", copyShareLink);
  els.exportCsvBtn.addEventListener("click", exportCsv);
  els.exportBackupBtn.addEventListener("click", () => void exportBackup());
  els.resetDemoBtn.addEventListener("click", () => void resetDemo());
  els.importBackupInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) void importBackup(file);
  });

  els.layoutOptions.forEach((btn) => {
    btn.addEventListener("click", () => {
      shared.layout = btn.dataset.layout;
      persistAndRender();
    });
  });

  els.searchInput.addEventListener("input", (event) => {
    prefs.query = event.target.value;
    persistPrefs();
    render();
  });

  els.sortSelect.addEventListener("change", (event) => {
    prefs.sort = event.target.value;
    persistPrefs();
    render();
  });

  els.hideArchivedInput.addEventListener("change", (event) => {
    prefs.hideArchived = event.target.checked;
    persistPrefs();
    render();
  });

  els.displayNameInput.addEventListener("change", (event) => {
    const nextName = event.target.value.trim();
    if (!nextName) {
      event.target.value = profile.name;
      return;
    }
    profile.name = nextName;
    persistProfile();
    render();
  });

  setupDnD();
}

function bootstrap() {
  setupEvents();
  render();
  persistBoardSnapshot();
}

bootstrap();
