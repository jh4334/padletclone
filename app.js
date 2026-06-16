const LOCAL_PREF_KEY = "boardly-local-prefs-v1";
const LOCAL_PROFILE_KEY = "boardly-local-profile-v1";
const LOCAL_STATE_PREFIX = "boardly-local-state-";
const LEGACY_STATE_PREFIX = "boardly-board-snapshot-";
const ATTACHMENT_DB = "boardly-local-attachments";
const ATTACHMENT_STORE = "files";
const DEFAULT_SUPABASE_TABLE = "boardly_boards";
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const FORBIDDEN_TERMS = ["spam", "hate", "욕설", "광고도배"];
const ACCESS_TOKEN_LENGTH = 12;
const READ_ONLY_MESSAGE = "읽기 전용 링크로 접속 중입니다. 편집 링크로 다시 열어야 변경할 수 있습니다.";
const ACCESS_PENDING_MESSAGE = "공유 링크 권한을 확인 중입니다. 잠시만 기다려주세요.";
const ACCESS_DENIED_MESSAGE = "권한 없음: 공유 링크의 토큰이 보드 권한과 일치하지 않습니다. 올바른 링크로 다시 열어주세요.";
const CLOUD_CONFLICT_TITLE = "원격 변경 있음";
const CLOUD_CONFLICT_MESSAGE = "다른 기기에서 먼저 저장한 변경이 있습니다. 지금 저장하면 그 변경을 덮어쓸 수 있습니다.";
const ATTACHMENT_KIND_LABELS = {
  image: "이미지",
  pdf: "PDF",
  sheet: "표",
  doc: "문서",
  deck: "슬라이드",
  text: "텍스트",
  file: "파일",
};

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
const ACTIVITY_LIMIT = 50;
const QUICK_FILTERS = [
  { id: "important", label: "중요", matches: (post) => post.priority === "P1" },
  { id: "blocked", label: "막힘", matches: (post) => post.status === "blocked" },
  { id: "decided", label: "결정", matches: (post) => post.status === "decided" || post.type === "decision" },
  { id: "attachments", label: "첨부 있음", matches: (post) => post.attachments.length > 0 },
];

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
  activity: [],
  access: createAccessConfig(),
};

const defaultPrefs = {
  activeSection: "All",
  query: "",
  sort: "recent",
  hideArchived: true,
  quickFilters: [],
};

const BOARD_TEMPLATES = [
  {
    id: "weekly-review",
    title: "주간 업무 리뷰",
    description: "이번 주 할 일, 막힌 일, 결정 사항을 한 번에 세팅합니다.",
    sections: ["Inbox", "Blocked", "Decision"],
    posts: [
      {
        title: "이번 주 핵심 할 일",
        content: "이번 주 반드시 끝낼 작업을 3개 이내로 정리합니다.",
        tags: ["주간", "할일"],
        section: "Inbox",
        type: "question",
        priority: "P1",
        status: "discussing",
      },
      {
        title: "막힌 일 점검",
        content: "혼자 해결하기 어려운 병목, 필요한 자료, 기다리는 답변을 기록합니다.",
        tags: ["병목", "지원요청"],
        section: "Blocked",
        type: "idea",
        priority: "P1",
        status: "blocked",
      },
      {
        title: "이번 주 결정 기록",
        content: "나중에 다시 확인해야 하는 선택과 그 이유를 남깁니다.",
        tags: ["결정", "회고"],
        section: "Decision",
        type: "decision",
        priority: "P2",
        status: "decided",
      },
    ],
  },
  {
    id: "meeting",
    title: "회의 보드",
    description: "안건, 자료, 결정, 후속 액션을 회의용으로 구성합니다.",
    sections: ["Agenda", "Resource", "Decision", "Action"],
    posts: [
      {
        title: "오늘 논의할 안건",
        content: "회의에서 반드시 결정해야 할 주제를 적습니다.",
        tags: ["회의", "안건"],
        section: "Agenda",
        type: "question",
        priority: "P1",
        status: "new",
      },
      {
        title: "참고 자료 모음",
        content: "논의에 필요한 링크, 파일, 근거 자료를 붙입니다.",
        tags: ["자료", "근거"],
        section: "Resource",
        type: "resource",
        priority: "P2",
        status: "discussing",
      },
      {
        title: "후속 액션",
        content: "담당자와 다음 행동을 댓글로 나눠 기록합니다.",
        tags: ["액션", "담당"],
        section: "Action",
        type: "idea",
        priority: "P2",
        status: "new",
      },
    ],
  },
  {
    id: "idea-lab",
    title: "아이디어 랩",
    description: "아이디어, 리스크, 검증 방법을 빠르게 분리합니다.",
    sections: ["Idea", "Risk", "Experiment", "Decision"],
    posts: [
      {
        title: "새 아이디어",
        content: "떠오른 생각을 판단하지 말고 먼저 적습니다.",
        tags: ["아이디어"],
        section: "Idea",
        type: "idea",
        priority: "P2",
        status: "new",
      },
      {
        title: "예상 리스크",
        content: "실패할 수 있는 이유와 확인해야 할 조건을 적습니다.",
        tags: ["리스크"],
        section: "Risk",
        type: "question",
        priority: "P1",
        status: "blocked",
      },
      {
        title: "검증 실험",
        content: "작게 확인할 수 있는 테스트 방법을 정합니다.",
        tags: ["실험", "검증"],
        section: "Experiment",
        type: "resource",
        priority: "P2",
        status: "discussing",
      },
    ],
  },
];

const LAYOUT_HELP = {
  canvas: {
    badge: "Canvas",
    title: "Canvas = 패들렛처럼 자유 수집",
    text: "패들렛처럼 카드를 보드 위에 자유롭게 배치해 아이디어, 자료, 링크, 댓글을 빠르게 모읍니다.",
  },
  workflow: {
    badge: "Workflow",
    title: "Workflow = 상태별 실행 흐름",
    text: "New, Discussing, Blocked, Decided, Archived 상태별로 일을 옮기며 진행 흐름을 봅니다.",
  },
  timeline: {
    badge: "Timeline",
    title: "Timeline = 시간순 기록 보기",
    text: "최신 카드와 결정 흐름을 시간순으로 훑어 보며 언제 무엇이 쌓였는지 확인합니다.",
  },
  focus: {
    badge: "Focus",
    title: "Focus = 중요한 것만 보기",
    text: "우선순위 P1, 막힘, 결정 카드만 남겨 지금 봐야 할 중요한 내용에 집중합니다.",
  },
};

const boardlyConfig = window.BOARDLY_CONFIG || {};
const boardId = getBoardIdFromUrl();
const accessRole = getAccessRoleFromUrl();
const requestedAccessToken = getAccessTokenFromUrl();
const profile = loadProfile();

const els = {
  layoutOptions: document.querySelectorAll(".layout-option"),
  quickFilterButtons: document.querySelectorAll("[data-quick-filter]"),
  activeFilterSummary: document.getElementById("activeFilterSummary"),
  searchInput: document.getElementById("searchInput"),
  sortSelect: document.getElementById("sortSelect"),
  hideArchivedInput: document.getElementById("hideArchivedInput"),
  copyLinkBtn: document.getElementById("copyLinkBtn"),
  viewLinkInput: document.getElementById("viewLinkInput"),
  editLinkInput: document.getElementById("editLinkInput"),
  copyViewLinkBtn: document.getElementById("copyViewLinkBtn"),
  copyEditLinkBtn: document.getElementById("copyEditLinkBtn"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  exportBackupBtn: document.getElementById("exportBackupBtn"),
  importBackupInput: document.getElementById("importBackupInput"),
  resetDemoBtn: document.getElementById("resetDemoBtn"),
  titleInput: document.getElementById("titleInput"),
  contentInput: document.getElementById("contentInput"),
  formFeedback: document.getElementById("formFeedback"),
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
  templateList: document.getElementById("templateList"),
  decisionList: document.getElementById("decisionList"),
  activityList: document.getElementById("activityList"),
  undoBtn: document.getElementById("undoBtn"),
  board: document.getElementById("board"),
  sectionTabs: document.getElementById("sectionTabs"),
  boardSubtitle: document.getElementById("boardSubtitle"),
  layoutHelpBadge: document.getElementById("layoutHelpBadge"),
  layoutHelpTitle: document.getElementById("layoutHelpTitle"),
  layoutHelpText: document.getElementById("layoutHelpText"),
  statsStrip: document.getElementById("statsStrip"),
  postTemplate: document.getElementById("postTemplate"),
  boardIdInput: document.getElementById("boardIdInput"),
  displayNameInput: document.getElementById("displayNameInput"),
  syncStatus: document.getElementById("syncStatus"),
  conflictPanel: document.getElementById("conflictPanel"),
  conflictTitle: document.getElementById("conflictTitle"),
  conflictText: document.getElementById("conflictText"),
  conflictReloadBtn: document.getElementById("conflictReloadBtn"),
  conflictKeepLocalBtn: document.getElementById("conflictKeepLocalBtn"),
  conflictBackupOverwriteBtn: document.getElementById("conflictBackupOverwriteBtn"),
  storageStatus: document.getElementById("storageStatus"),
  storageModeTitle: document.getElementById("storageModeTitle"),
  storageModeText: document.getElementById("storageModeText"),
  accessMode: document.getElementById("accessMode"),
  accessHelpText: document.getElementById("accessHelpText"),
  storagePosts: document.getElementById("storagePosts"),
  storageAttachments: document.getElementById("storageAttachments"),
  storageDecisions: document.getElementById("storageDecisions"),
  editOverlay: document.getElementById("editOverlay"),
  closeEditBtn: document.getElementById("closeEditBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  saveEditBtn: document.getElementById("saveEditBtn"),
  editTitleInput: document.getElementById("editTitleInput"),
  editContentInput: document.getElementById("editContentInput"),
  editTypeInput: document.getElementById("editTypeInput"),
  editStatusInput: document.getElementById("editStatusInput"),
  editPriorityInput: document.getElementById("editPriorityInput"),
  editSectionInput: document.getElementById("editSectionInput"),
  editEvidenceInput: document.getElementById("editEvidenceInput"),
  editTagsInput: document.getElementById("editTagsInput"),
  editAttachmentList: document.getElementById("editAttachmentList"),
  editAttachmentInput: document.getElementById("editAttachmentInput"),
  editFeedback: document.getElementById("editFeedback"),
};

const hadStoredBoardSnapshot = hasStoredBoardSnapshot();
let shared = normalizeSharedState(loadBoardSnapshot());
let prefs = loadPrefs();
let drag = { id: null, offsetX: 0, offsetY: 0 };
let undoStack = [];
let editing = { postId: null, removedAttachmentIds: new Set() };
let attachmentDbPromise = null;
let cloud = {
  requested: isSupabaseRequested(),
  configured: false,
  ready: false,
  client: null,
  table: boardlyConfig.SUPABASE_TABLE || DEFAULT_SUPABASE_TABLE,
  saveTimer: null,
  saving: false,
  pendingSave: false,
  lastError: "",
  lastKnownUpdatedAt: "",
  conflict: null,
};
let accessGate = {
  status: requestedAccessToken && isSupabaseRequested() ? "pending" : "open",
};

function getBoardIdFromUrl() {
  const url = new URL(window.location.href);
  const id = (url.searchParams.get("board") || "my-workspace").trim();
  return id.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 48) || "my-workspace";
}

function getAccessRoleFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get("role") === "view" ? "view" : "edit";
}

function getAccessTokenFromUrl() {
  const url = new URL(window.location.href);
  return (url.searchParams.get("token") || "").trim();
}

function hasStoredBoardSnapshot() {
  try {
    return Boolean(localStorage.getItem(stateKey()) || localStorage.getItem(legacyStateKey()));
  } catch {
    return false;
  }
}

function createAccessToken() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, ACCESS_TOKEN_LENGTH);
}

function createAccessConfig() {
  return {
    ownerId: "",
    viewToken: createAccessToken(),
    editToken: createAccessToken(),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeAccess(access) {
  return {
    ...createAccessConfig(),
    ...(access && typeof access === "object" ? access : {}),
  };
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

function getFileExtension(name = "") {
  const parts = String(name).toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) : "";
}

function detectAttachmentKind(attachment) {
  const type = String(attachment?.type || "").toLowerCase();
  const extension = getFileExtension(attachment?.name);

  if (type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension)) return "image";
  if (type === "application/pdf" || extension === "pdf") return "pdf";
  if (type.includes("spreadsheet") || type.includes("excel") || ["csv", "xlsx", "xls"].includes(extension)) return "sheet";
  if (type.includes("presentation") || ["ppt", "pptx"].includes(extension)) return "deck";
  if (type.includes("word") || ["doc", "docx"].includes(extension)) return "doc";
  if (type.startsWith("text/") || ["txt", "md"].includes(extension)) return "text";
  return "file";
}

function sanitizeStorageFileName(name) {
  return String(name || "attachment")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "attachment";
}

function createAttachmentStoragePath(id, name) {
  return `${boardId}/${id}/${sanitizeStorageFileName(name)}`;
}

function normalizeAttachment(attachment) {
  if (!attachment || typeof attachment !== "object") return null;
  const id = attachment.id || crypto.randomUUID();
  const name = attachment.name || attachment.fileName || "첨부 자료";
  const type = attachment.type || attachment.mimeType || "application/octet-stream";
  const storageProvider = attachment.storageProvider || attachment.storage?.provider || "indexeddb";

  return {
    id,
    name,
    size: Number.isFinite(attachment.size) ? attachment.size : 0,
    type,
    uploadedAt: attachment.uploadedAt || new Date().toISOString(),
    previewKind: attachment.previewKind || detectAttachmentKind({ name, type }),
    storageProvider,
    storageBucket: attachment.storageBucket || attachment.storage?.bucket || "",
    storagePath: attachment.storagePath || attachment.storage?.path || createAttachmentStoragePath(id, name),
    localOnly: typeof attachment.localOnly === "boolean" ? attachment.localOnly : storageProvider === "indexeddb",
  };
}

function normalizeActivityEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  return {
    id: entry.id || crypto.randomUUID(),
    label: entry.label || "변경 사항",
    actor: entry.actor || "익명 팀원",
    createdAt: entry.createdAt || new Date().toISOString(),
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
    activity: Array.isArray(value?.activity)
      ? value.activity.map(normalizeActivityEntry).filter(Boolean).slice(0, ACTIVITY_LIMIT)
      : [],
    access: normalizeAccess(value?.access),
  };

  if (!merged.access.ownerId) merged.access.ownerId = profile.id;

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

function prefsKey() {
  return `${LOCAL_PREF_KEY}-${boardId}`;
}

function normalizePrefs(value) {
  const parsed = value && typeof value === "object" ? value : {};
  const next = { ...structuredClone(defaultPrefs), ...parsed };
  const knownFilterIds = new Set(QUICK_FILTERS.map((filter) => filter.id));
  next.quickFilters = Array.isArray(next.quickFilters)
    ? next.quickFilters.filter((id, index, list) => knownFilterIds.has(id) && list.indexOf(id) === index)
    : [];
  return next;
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(prefsKey()) || localStorage.getItem(LOCAL_PREF_KEY);
    return raw ? normalizePrefs(JSON.parse(raw)) : structuredClone(defaultPrefs);
  } catch {
    return structuredClone(defaultPrefs);
  }
}

function persistPrefs() {
  localStorage.setItem(prefsKey(), JSON.stringify(prefs));
}

function loadBoardSnapshot() {
  try {
    const raw = localStorage.getItem(stateKey()) || localStorage.getItem(legacyStateKey());
    return raw ? JSON.parse(raw) : structuredClone(defaultSharedState);
  } catch {
    return structuredClone(defaultSharedState);
  }
}

function persistBoardSnapshot(options = {}) {
  const syncCloud = options.syncCloud !== false;
  try {
    localStorage.setItem(stateKey(), JSON.stringify(shared));
    updateSaveStatus(cloud.ready ? "Cloud queued" : "Local saved", cloud.ready ? "syncing" : "local");
    if (syncCloud) scheduleCloudSave();
  } catch {
    updateSaveStatus("Storage full", "error");
  }
}

function mergeCloudAccess(snapshot, row) {
  const merged = normalizeSharedState(snapshot);
  merged.access = normalizeAccess({
    ...merged.access,
    viewToken: row?.view_token || merged.access.viewToken,
    editToken: row?.edit_token || merged.access.editToken,
    ownerId: row?.owner_id || merged.access.ownerId || profile.id,
    updatedAt: row?.access_updated_at || merged.access.updatedAt,
  });
  return merged;
}

function getCloudAccessPayload() {
  if (!shared.access.ownerId) shared.access.ownerId = profile.id;
  return {
    view_token: shared.access.viewToken,
    edit_token: shared.access.editToken,
    owner_id: shared.access.ownerId,
    access_updated_at: shared.access.updatedAt || new Date().toISOString(),
  };
}

function getExpectedAccessToken() {
  return accessRole === "view" ? shared.access.viewToken : shared.access.editToken;
}

function validateAccessToken() {
  if (!requestedAccessToken) {
    accessGate.status = "open";
    return;
  }

  if (cloud.requested && !cloud.ready && !hadStoredBoardSnapshot) {
    accessGate.status = cloud.lastError && !cloud.configured ? "open" : "pending";
    return;
  }

  if (!cloud.requested && !hadStoredBoardSnapshot) {
    accessGate.status = "open";
    return;
  }

  accessGate.status = requestedAccessToken === getExpectedAccessToken() ? "open" : "denied";
}

function isAccessDenied() {
  return accessGate.status === "denied";
}

function isAccessPending() {
  return accessGate.status === "pending";
}

function isAccessRestricted() {
  return isAccessDenied() || isAccessPending();
}

function getAccessRestrictionMessage() {
  if (isAccessDenied()) return ACCESS_DENIED_MESSAGE;
  if (isAccessPending()) return ACCESS_PENDING_MESSAGE;
  return "";
}

function isBoardLocked() {
  return isReadOnlyMode() || isAccessRestricted();
}

function isReadOnlyMode() {
  return accessRole === "view";
}

function createAccessLink(role) {
  const url = new URL(window.location.href);
  url.searchParams.set("board", boardId);
  url.searchParams.set("role", role);
  url.searchParams.set("token", role === "view" ? shared.access.viewToken : shared.access.editToken);
  return url.toString();
}

function canEditBoard() {
  if (isAccessRestricted()) {
    const message = getAccessRestrictionMessage();
    setComposerFeedback(message, "error");
    updateSaveStatus(isAccessDenied() ? "Access denied" : "Access pending", isAccessDenied() ? "error" : "warning");
    return false;
  }
  if (!isReadOnlyMode()) return true;
  setComposerFeedback(READ_ONLY_MESSAGE, "error");
  updateSaveStatus("Read only", "warning");
  return false;
}

function canReadBoard() {
  if (!isAccessRestricted()) return true;
  const message = getAccessRestrictionMessage();
  setComposerFeedback(message, "error");
  updateSaveStatus(isAccessDenied() ? "Access denied" : "Access pending", isAccessDenied() ? "error" : "warning");
  return false;
}

function cloneSharedState(value = shared) {
  return structuredClone(value);
}

function findPost(postId) {
  return shared.posts.find((post) => post.id === postId);
}

function addActivity(label) {
  shared.activity = [
    {
      id: crypto.randomUUID(),
      label,
      actor: profile.name,
      createdAt: new Date().toISOString(),
    },
    ...(Array.isArray(shared.activity) ? shared.activity : []),
  ].slice(0, ACTIVITY_LIMIT);
}

function commitMutation(label, mutate) {
  if (!canEditBoard()) return null;
  const before = cloneSharedState();
  const result = mutate();
  undoStack.push({ label, snapshot: before });
  addActivity(label);
  persistAndRender();
  return result;
}

function undoLastAction() {
  const previous = undoStack.pop();
  if (!previous) return;

  closeEditDrawer();
  shared = normalizeSharedState(previous.snapshot);
  addActivity(`되돌림: ${previous.label}`);
  persistAndRender();
}

function updateSaveStatus(text, state = "local") {
  els.syncStatus.textContent = text;
  els.syncStatus.dataset.state = state;
}

function isSupabaseRequested() {
  return boardlyConfig.MODE === "supabase" || Boolean(boardlyConfig.SUPABASE_URL || boardlyConfig.SUPABASE_ANON_KEY);
}

function getSupabaseUrl() {
  return String(boardlyConfig.SUPABASE_URL || "").trim();
}

function getSupabaseKey() {
  return String(boardlyConfig.SUPABASE_ANON_KEY || boardlyConfig.SUPABASE_KEY || "").trim();
}

function createCloudClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  cloud.configured = Boolean(url && key);

  if (!cloud.requested) return null;
  if (!cloud.configured) {
    cloud.lastError = "SUPABASE_ANON_KEY 필요";
    return null;
  }
  if (!window.supabase?.createClient) {
    cloud.lastError = "Supabase SDK 로드 실패";
    return null;
  }

  return window.supabase.createClient(url, key);
}

async function fetchCloudRow() {
  const { data, error } = await cloud.client
    .from(cloud.table)
    .select("snapshot, updated_at, view_token, edit_token, owner_id, access_updated_at")
    .eq("board_id", boardId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

function hasCloudConflict() {
  return Boolean(cloud.conflict);
}

function clearCloudConflict() {
  cloud.conflict = null;
}

function markCloudConflict(row) {
  cloud.conflict = {
    remoteRow: row,
    remoteUpdatedAt: row?.updated_at || "",
    detectedAt: new Date().toISOString(),
  };
  updateSaveStatus("Remote changed", "warning");
  renderControls();
}

function rememberCloudVersion(row) {
  cloud.lastKnownUpdatedAt = row?.updated_at || cloud.lastKnownUpdatedAt || "";
}

async function loadCloudRow(row, statusText = "Cloud loaded") {
  if (!row?.snapshot) return false;

  shared = mergeCloudAccess(row.snapshot, row);
  rememberCloudVersion(row);
  validateAccessToken();
  clearCloudConflict();
  persistBoardSnapshot({ syncCloud: false });
  render();
  updateSaveStatus(statusText, "cloud");
  return true;
}

async function findRemoteConflict() {
  if (!cloud.lastKnownUpdatedAt) return null;
  const row = await fetchCloudRow();
  if (!row?.updated_at) return null;
  if (row.updated_at === cloud.lastKnownUpdatedAt) return null;
  return row;
}

async function initializeCloudSync() {
  if (!cloud.requested) {
    updateSaveStatus("Local saved", "local");
    renderControls();
    return;
  }

  updateSaveStatus("Cloud setup", "syncing");
  cloud.client = createCloudClient();

  if (!cloud.client) {
    validateAccessToken();
    updateSaveStatus("Local fallback", "warning");
    renderControls();
    return;
  }

  cloud.ready = true;

  try {
    const data = await fetchCloudRow();

    if (data?.snapshot) {
      shared = mergeCloudAccess(data.snapshot, data);
      rememberCloudVersion(data);
      validateAccessToken();
      if (isAccessRestricted()) {
        render();
        updateSaveStatus(isAccessDenied() ? "Access denied" : "Access pending", isAccessDenied() ? "error" : "warning");
        return;
      }
      persistBoardSnapshot({ syncCloud: false });
      render();
      updateSaveStatus("Cloud loaded", "cloud");
      return;
    }

    accessGate.status = "open";
    await saveCloudSnapshot();
  } catch (error) {
    cloud.lastError = error.message || "Supabase 연결 실패";
    cloud.ready = false;
    validateAccessToken();
    updateSaveStatus("Local fallback", "warning");
    renderControls();
  }
}

function scheduleCloudSave() {
  if (!cloud.ready || !cloud.client) return;
  window.clearTimeout(cloud.saveTimer);
  cloud.saveTimer = window.setTimeout(() => {
    void saveCloudSnapshot();
  }, 500);
}

async function saveCloudSnapshot(options = {}) {
  const force = options.force === true;
  if (!cloud.ready || !cloud.client) return;
  if (isAccessRestricted() || isReadOnlyMode()) return;
  if (hasCloudConflict() && !force) return;

  if (cloud.saving) {
    cloud.pendingSave = true;
    return;
  }

  cloud.saving = true;
  updateSaveStatus("Cloud saving", "syncing");

  try {
    if (!force) {
      const conflictRow = await findRemoteConflict();
      if (conflictRow) {
        markCloudConflict(conflictRow);
        return;
      }
    }

    const savedAt = new Date().toISOString();
    const { error } = await cloud.client
      .from(cloud.table)
      .upsert({
        board_id: boardId,
        snapshot: shared,
        ...getCloudAccessPayload(),
        updated_at: savedAt,
      }, { onConflict: "board_id" });

    if (error) throw error;

    cloud.lastKnownUpdatedAt = savedAt;
    clearCloudConflict();
    cloud.lastError = "";
    updateSaveStatus("Cloud saved", "cloud");
  } catch (error) {
    cloud.lastError = error.message || "Supabase 저장 실패";
    updateSaveStatus("Cloud error", "error");
  } finally {
    cloud.saving = false;
    if (cloud.pendingSave) {
      cloud.pendingSave = false;
      scheduleCloudSave();
    }
    renderControls();
  }
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
    .filter(matchesQuickFilters)
    .filter((post) => {
      if (!q) return true;
      return [post.title, post.content, post.authorName, post.status, post.priority, post.type, post.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(q);
    })
    .sort(sortPosts);
}

function matchesQuickFilters(post) {
  if (!prefs.quickFilters.length) return true;
  return prefs.quickFilters.some((id) => QUICK_FILTERS.find((filter) => filter.id === id)?.matches(post));
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
  const card = document.createElement("article");
  card.className = `attachment-card ${attachment.previewKind}`;

  const preview = document.createElement("div");
  preview.className = "attachment-preview";
  preview.textContent = getAttachmentPreviewGlyph(attachment);

  const body = document.createElement("div");
  body.className = "attachment-body";

  const header = document.createElement("div");
  header.className = "attachment-head";

  const title = document.createElement("strong");
  title.textContent = attachment.name;

  const kind = document.createElement("span");
  kind.className = "attachment-kind";
  kind.textContent = ATTACHMENT_KIND_LABELS[attachment.previewKind] || ATTACHMENT_KIND_LABELS.file;

  const meta = document.createElement("div");
  meta.className = "attachment-meta";
  meta.textContent = `${formatBytes(attachment.size)} · ${getAttachmentStorageLabel(attachment)}`;

  const status = document.createElement("div");
  status.className = "attachment-storage";
  status.textContent = "파일 본문 확인 중";

  const link = document.createElement("a");
  link.className = "attachment-open locked";
  link.href = "#";
  link.textContent = "열기 대기";
  link.addEventListener("click", (event) => event.preventDefault());

  header.append(title, kind);
  body.append(header, meta, status, link);
  card.append(preview, body);
  container.appendChild(card);

  try {
    const blob = await getAttachment(attachment.id);
    if (!blob) {
      status.textContent = `${getAttachmentStorageLabel(attachment)} · 본문 없음`;
      link.textContent = "이 브라우저에 파일 없음";
      return;
    }

    const objectUrl = typeof URL.createObjectURL === "function" ? URL.createObjectURL(blob) : "";
    status.textContent = `${getAttachmentStorageLabel(attachment)} · 열기 가능`;
    if (objectUrl) {
      link.href = objectUrl;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.download = attachment.name;
      link.textContent = "파일 열기";
      link.classList.remove("locked");

      if (attachment.previewKind === "image") {
        preview.textContent = "";
        const image = document.createElement("img");
        image.src = objectUrl;
        image.alt = `${attachment.name} 미리보기`;
        preview.appendChild(image);
      }
    } else {
      link.textContent = "브라우저 열기 미지원";
    }
  } catch {
    status.textContent = `${getAttachmentStorageLabel(attachment)} · 본문 없음`;
    link.textContent = "이 브라우저에 파일 없음";
  }
}

function getAttachmentPreviewGlyph(attachment) {
  const glyphs = {
    image: "IMG",
    pdf: "PDF",
    sheet: "CSV",
    doc: "DOC",
    deck: "PPT",
    text: "TXT",
    file: "FILE",
  };
  return glyphs[attachment.previewKind] || glyphs.file;
}

function getAttachmentStorageLabel(attachment) {
  if (attachment.storageProvider === "supabase") return "클라우드 저장";
  return attachment.localOnly ? "이 브라우저 전용" : "클라우드 준비";
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatCloudTimestamp(value) {
  if (!value) return "알 수 없음";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function renderSectionInputs() {
  els.sectionInput.innerHTML = "";
  if (isAccessRestricted()) {
    const option = document.createElement("option");
    option.value = "Inbox";
    option.textContent = "권한 확인 필요";
    els.sectionInput.appendChild(option);
    return;
  }

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
  if (isAccessRestricted()) {
    const btn = document.createElement("button");
    btn.className = "section-tab active";
    btn.textContent = isAccessDenied() ? "권한 없음" : "확인 중";
    btn.type = "button";
    btn.disabled = true;
    els.sectionTabs.appendChild(btn);
    return;
  }

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
  if (isAccessRestricted()) {
    els.statsStrip.innerHTML = "";
    const item = document.createElement("div");
    item.className = "stat-card";
    item.innerHTML = `<strong>-</strong><span>${isAccessDenied() ? "권한 없음" : "확인 중"}</span>`;
    els.statsStrip.appendChild(item);
    els.storagePosts.textContent = "-";
    els.storageAttachments.textContent = "-";
    els.storageDecisions.textContent = "-";
    return;
  }

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
  if (isAccessRestricted()) {
    els.decisionList.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = getAccessRestrictionMessage();
    els.decisionList.appendChild(empty);
    return;
  }

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

function renderTemplateList() {
  els.templateList.innerHTML = "";
  BOARD_TEMPLATES.forEach((template) => {
    const btn = document.createElement("button");
    btn.className = "template-card";
    btn.type = "button";
    btn.dataset.template = template.id;

    const title = document.createElement("strong");
    title.textContent = template.title;
    const description = document.createElement("span");
    description.textContent = template.description;

    btn.disabled = isBoardLocked();
    btn.append(title, description);
    btn.addEventListener("click", () => applyTemplate(template.id));
    els.templateList.appendChild(btn);
  });
}

function renderActivityList() {
  els.activityList.innerHTML = "";
  els.undoBtn.disabled = undoStack.length === 0;

  if (isAccessRestricted()) {
    els.undoBtn.disabled = true;
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = getAccessRestrictionMessage();
    els.activityList.appendChild(empty);
    return;
  }

  const activity = Array.isArray(shared.activity) ? shared.activity.slice(0, 10) : [];
  if (activity.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "아직 기록된 변경이 없습니다.";
    els.activityList.appendChild(empty);
    return;
  }

  activity.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "activity-item";
    const label = document.createElement("strong");
    label.textContent = entry.label;
    const meta = document.createElement("span");
    meta.textContent = `${entry.actor} · ${new Intl.DateTimeFormat("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(entry.createdAt))}`;
    item.append(label, meta);
    els.activityList.appendChild(item);
  });
}

function renderEditSectionInputs() {
  els.editSectionInput.innerHTML = "";
  shared.sections
    .filter((section) => section !== "All")
    .forEach((section) => {
      const option = document.createElement("option");
      option.value = section;
      option.textContent = section;
      els.editSectionInput.appendChild(option);
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
  const editBtn = fragment.querySelector(".card-edit-btn");
  const deleteBtn = fragment.querySelector(".card-delete-btn");
  const readonly = isBoardLocked();

  card.dataset.id = post.id;
  card.draggable = shared.layout === "canvas" && !readonly;
  titleEl.textContent = post.title;
  contentEl.textContent = post.content;
  kickerEl.textContent = getCardKicker(post);
  authorEl.textContent = post.authorName || "익명 팀원";

  const badgeStatus = post.moderationStatus === "pending" ? "pending" : post.status;
  statusBadge.textContent = STATUS_LABELS[badgeStatus] || badgeStatus;
  statusBadge.classList.add(`status-${badgeStatus}`);
  statusSelect.value = post.status;
  statusSelect.disabled = readonly;
  editBtn.disabled = readonly;
  deleteBtn.disabled = readonly;
  commentInput.disabled = readonly;
  commentBtn.disabled = readonly;

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
    btn.disabled = readonly;
    btn.addEventListener("click", () => {
      commitMutation(`반응 추가: ${post.title}`, () => {
        const target = findPost(post.id);
        if (!target) return;
        target.reactions[key] = (target.reactions[key] || 0) + 1;
      });
    });
  });

  commentBtn.addEventListener("click", () => {
    const value = commentInput.value.trim();
    if (!value) return;
    commitMutation(`댓글 추가: ${post.title}`, () => {
      const target = findPost(post.id);
      if (!target) return;
      target.comments.push({
        id: crypto.randomUUID(),
        authorName: profile.name,
        text: value,
        createdAt: new Date().toISOString(),
      });
    });
  });

  statusSelect.addEventListener("change", (event) => {
    const nextStatus = event.target.value;
    if (post.status === nextStatus) return;
    commitMutation(`상태 변경: ${post.title} -> ${STATUS_LABELS[nextStatus]}`, () => {
      const target = findPost(post.id);
      if (target) target.status = nextStatus;
    });
  });

  editBtn.addEventListener("click", () => {
    openEditDrawer(post.id);
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
  els.board.className = `board ${shared.layout}`;
  els.board.innerHTML = "";

  if (isAccessRestricted()) {
    appendBoardEmptyState(getAccessRestrictionMessage());
    return;
  }

  const posts = filteredPosts();

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
  els.storageStatus.textContent = getStorageStatusText();
  renderStorageModeNotice();
  renderConflictPanel();
  renderAccessPanel();
  renderQuickFilters();

  els.layoutOptions.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.layout === shared.layout);
  });

  renderLayoutHelp();
  applyReadOnlyState();
}

function renderQuickFilters() {
  const active = new Set(prefs.quickFilters);

  els.quickFilterButtons.forEach((btn) => {
    const isActive = active.has(btn.dataset.quickFilter);
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  const activeLabels = prefs.quickFilters
    .map((id) => QUICK_FILTERS.find((filter) => filter.id === id)?.label)
    .filter(Boolean);

  els.activeFilterSummary.textContent = activeLabels.length
    ? `빠른 필터: ${activeLabels.join(", ")}`
    : "빠른 필터 없음";
}

function renderLayoutHelp() {
  const help = LAYOUT_HELP[shared.layout] || LAYOUT_HELP.canvas;
  els.layoutHelpBadge.textContent = help.badge;
  els.layoutHelpTitle.textContent = help.title;
  els.layoutHelpText.textContent = help.text;
}

function renderAccessPanel() {
  els.accessMode.classList.remove("readonly", "pending", "denied");

  if (isAccessRestricted()) {
    els.viewLinkInput.value = "";
    els.editLinkInput.value = "";
    els.accessMode.textContent = isAccessDenied() ? "권한 없음" : "확인 중";
    els.accessMode.classList.add(isAccessDenied() ? "denied" : "pending");
    els.accessHelpText.textContent = getAccessRestrictionMessage();
    return;
  }

  els.viewLinkInput.value = createAccessLink("view");
  els.editLinkInput.value = createAccessLink("edit");

  if (isReadOnlyMode()) {
    els.accessMode.textContent = "읽기 전용";
    els.accessMode.classList.add("readonly");
    els.accessHelpText.textContent = READ_ONLY_MESSAGE;
    return;
  }

  els.accessMode.textContent = "편집 가능";
  els.accessMode.classList.remove("readonly");
  els.accessHelpText.textContent = "편집 링크는 작업용, 읽기 링크는 보기 전용으로 공유하세요.";
}

function renderConflictPanel() {
  if (!els.conflictPanel) return;

  if (!hasCloudConflict() || isAccessRestricted()) {
    els.conflictPanel.hidden = true;
    return;
  }

  els.conflictPanel.hidden = false;
  els.conflictTitle.textContent = CLOUD_CONFLICT_TITLE;
  els.conflictText.textContent = `${CLOUD_CONFLICT_MESSAGE} 원격 저장 시각: ${formatCloudTimestamp(cloud.conflict.remoteUpdatedAt)}`;
}

function applyReadOnlyState() {
  const readonly = isBoardLocked();
  const restricted = isAccessRestricted();
  const controls = [
    els.resetDemoBtn,
    els.titleInput,
    els.contentInput,
    els.typeInput,
    els.statusInput,
    els.priorityInput,
    els.sectionInput,
    els.evidenceInput,
    els.tagsInput,
    els.attachmentInput,
    els.addPostBtn,
    els.newSectionInput,
    els.addSectionBtn,
    els.importBackupInput,
  ];

  controls.forEach((control) => {
    if (control) control.disabled = readonly;
  });

  els.copyLinkBtn.disabled = restricted;
  els.copyViewLinkBtn.disabled = restricted;
  els.copyEditLinkBtn.disabled = restricted;
  els.exportCsvBtn.disabled = restricted;
  els.exportBackupBtn.disabled = restricted;

  if (restricted) {
    els.undoBtn.disabled = true;
    setComposerFeedback(getAccessRestrictionMessage(), "error");
  } else if (readonly) {
    els.undoBtn.disabled = true;
    setComposerFeedback(READ_ONLY_MESSAGE, "error");
  } else {
    els.undoBtn.disabled = undoStack.length === 0;
  }
}

function getStorageStatusText() {
  if (hasCloudConflict()) return "원격 변경 있음";
  if (isAccessDenied()) return "권한 없음";
  if (isAccessPending()) return "권한 확인 중";
  if (isReadOnlyMode()) return "읽기 전용 링크";
  if (cloud.ready) return "Supabase + 브라우저 저장";
  if (cloud.requested && !cloud.configured) return "Supabase 키 입력 필요";
  if (cloud.requested && cloud.lastError) return "Supabase 연결 대기";
  return "이 기기 브라우저에 저장됨";
}

function renderStorageModeNotice() {
  if (hasCloudConflict()) {
    els.storageModeTitle.textContent = CLOUD_CONFLICT_TITLE;
    els.storageModeText.textContent = `${CLOUD_CONFLICT_MESSAGE} 원격 불러오기, 로컬 유지, 백업 후 덮어쓰기 중 하나를 선택하세요.`;
    return;
  }

  if (isAccessDenied()) {
    els.storageModeTitle.textContent = "권한 확인 실패";
    els.storageModeText.textContent = ACCESS_DENIED_MESSAGE;
    return;
  }

  if (isAccessPending()) {
    els.storageModeTitle.textContent = "공유 링크 확인 중";
    els.storageModeText.textContent = ACCESS_PENDING_MESSAGE;
    return;
  }

  if (cloud.ready) {
    els.storageModeTitle.textContent = "Supabase 동기화";
    els.storageModeText.textContent = "카드와 보드 상태는 Supabase에 저장되고, 이 브라우저에도 임시 보관됩니다. 첨부 파일 본문은 아직 브라우저 저장소를 사용합니다.";
    return;
  }

  if (cloud.requested && !cloud.configured) {
    els.storageModeTitle.textContent = "Supabase 연결 준비됨";
    els.storageModeText.textContent = "프로젝트 URL은 설정됐습니다. anon/public key를 넣으면 보드 데이터가 Supabase에 저장됩니다.";
    return;
  }

  if (cloud.requested && cloud.lastError) {
    els.storageModeTitle.textContent = "로컬 fallback";
    els.storageModeText.textContent = `Supabase 연결 전까지 이 브라우저에 저장됩니다. 상태: ${cloud.lastError}`;
    return;
  }

  els.storageModeTitle.textContent = "로컬 전용 보드";
  els.storageModeText.textContent = "카드와 첨부는 이 브라우저에만 저장됩니다. 다른 기기로 옮길 때는 백업/복원을 사용하세요.";
}

function render() {
  renderSectionInputs();
  renderEditSectionInputs();
  renderSectionTabs();
  renderStats();
  renderTemplateList();
  renderDecisionList();
  renderActivityList();
  renderBoard();
  renderControls();
}

function persistAndRender() {
  persistBoardSnapshot();
  render();
}

function setComposerFeedback(message, type = "neutral") {
  els.formFeedback.textContent = message;
  els.formFeedback.classList.toggle("error", type === "error");
  els.formFeedback.classList.toggle("success", type === "success");
}

function setFieldValidity(input, isValid) {
  input.setAttribute("aria-invalid", isValid ? "false" : "true");
}

function validateComposer() {
  const title = els.titleInput.value.trim();
  const content = els.contentInput.value.trim();
  const missing = [];

  setFieldValidity(els.titleInput, Boolean(title));
  setFieldValidity(els.contentInput, Boolean(content));

  if (!title) missing.push("제목");
  if (!content) missing.push("내용");

  if (missing.length > 0) {
    setComposerFeedback(`${missing.join(", ")}을 입력하면 카드가 저장됩니다.`, "error");
    (title ? els.contentInput : els.titleInput).focus();
    return false;
  }

  return true;
}

function resetComposerValidation() {
  setFieldValidity(els.titleInput, true);
  setFieldValidity(els.contentInput, true);
  setComposerFeedback("제목과 내용만 적으면 바로 추가할 수 있습니다. Ctrl/⌘ + Enter로 저장합니다.");
}

function setEditFeedback(message, type = "neutral") {
  els.editFeedback.textContent = message;
  els.editFeedback.classList.toggle("error", type === "error");
  els.editFeedback.classList.toggle("success", type === "success");
}

function setEditFieldValidity(input, isValid) {
  input.setAttribute("aria-invalid", isValid ? "false" : "true");
}

function resetEditValidation() {
  setEditFieldValidity(els.editTitleInput, true);
  setEditFieldValidity(els.editContentInput, true);
  setEditFeedback("수정 내용을 저장하면 보드에 바로 반영됩니다.");
}

function validateEditForm() {
  const title = els.editTitleInput.value.trim();
  const content = els.editContentInput.value.trim();
  const missing = [];

  setEditFieldValidity(els.editTitleInput, Boolean(title));
  setEditFieldValidity(els.editContentInput, Boolean(content));

  if (!title) missing.push("제목");
  if (!content) missing.push("내용");

  if (missing.length > 0) {
    setEditFeedback(`${missing.join(", ")}을 입력해야 수정할 수 있습니다.`, "error");
    (title ? els.editContentInput : els.editTitleInput).focus();
    return false;
  }

  return true;
}

function openEditDrawer(postId) {
  if (!canEditBoard()) return;
  const post = findPost(postId);
  if (!post) return;

  editing = { postId, removedAttachmentIds: new Set() };
  renderEditSectionInputs();
  els.editTitleInput.value = post.title;
  els.editContentInput.value = post.content;
  els.editTypeInput.value = post.type;
  els.editStatusInput.value = post.status;
  els.editPriorityInput.value = post.priority;
  els.editSectionInput.value = post.section;
  els.editEvidenceInput.value = post.evidenceUrl || "";
  els.editTagsInput.value = post.tags.join(", ");
  els.editAttachmentInput.value = "";
  resetEditValidation();
  renderEditAttachmentList();
  els.editOverlay.hidden = false;
  els.editTitleInput.focus();
}

function closeEditDrawer() {
  if (!els.editOverlay) return;
  els.editOverlay.hidden = true;
  editing = { postId: null, removedAttachmentIds: new Set() };
  if (els.editAttachmentInput) els.editAttachmentInput.value = "";
}

function renderEditAttachmentList() {
  const post = findPost(editing.postId);
  els.editAttachmentList.innerHTML = "";

  const attachments = post
    ? post.attachments.filter((attachment) => !editing.removedAttachmentIds.has(attachment.id))
    : [];

  if (attachments.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "현재 첨부가 없습니다.";
    els.editAttachmentList.appendChild(empty);
    return;
  }

  attachments.forEach((attachment) => {
    const item = document.createElement("div");
    item.className = "edit-attachment-item";

    const label = document.createElement("span");
    label.textContent = `${ATTACHMENT_KIND_LABELS[attachment.previewKind] || "파일"} · ${attachment.name}${attachment.size ? ` · ${formatBytes(attachment.size)}` : ""}`;

    const removeBtn = document.createElement("button");
    removeBtn.className = "edit-attachment-remove";
    removeBtn.type = "button";
    removeBtn.textContent = "제거";
    removeBtn.addEventListener("click", () => {
      editing.removedAttachmentIds.add(attachment.id);
      setEditFeedback("첨부 제거가 예약됐습니다. 저장해야 반영됩니다.");
      renderEditAttachmentList();
    });

    item.append(label, removeBtn);
    els.editAttachmentList.appendChild(item);
  });
}

async function saveEditedPost() {
  if (!canEditBoard()) return;
  const post = findPost(editing.postId);
  if (!post || !validateEditForm()) return;

  const nextTitle = els.editTitleInput.value.trim();
  const nextContent = els.editContentInput.value.trim();
  const attachmentFile = els.editAttachmentInput.files[0] || null;
  let newAttachment = null;

  if (attachmentFile) {
    if (attachmentFile.size > MAX_ATTACHMENT_BYTES) {
      setEditFeedback("첨부 파일은 10MB 이하만 저장할 수 있습니다.", "error");
      return;
    }

    try {
      els.saveEditBtn.disabled = true;
      els.saveEditBtn.textContent = "저장 중";
      newAttachment = await createLocalAttachment(attachmentFile);
    } catch (error) {
      setEditFeedback(`첨부 저장 실패: ${error.message}`, "error");
      return;
    } finally {
      els.saveEditBtn.disabled = false;
      els.saveEditBtn.textContent = "수정 저장";
    }
  }

  commitMutation(`카드 수정: ${nextTitle}`, () => {
    const target = findPost(post.id);
    if (!target) return;

    target.title = nextTitle;
    target.content = nextContent;
    target.type = els.editTypeInput.value;
    target.status = els.editStatusInput.value;
    target.priority = els.editPriorityInput.value;
    target.section = els.editSectionInput.value || "Inbox";
    target.evidenceUrl = els.editEvidenceInput.value.trim();
    target.tags = parseTags(els.editTagsInput.value);
    target.attachments = target.attachments
      .filter((attachment) => !editing.removedAttachmentIds.has(attachment.id));
    if (newAttachment) target.attachments.push(newAttachment);
  });

  closeEditDrawer();
}

async function addPost() {
  if (!canEditBoard()) return;
  const title = els.titleInput.value.trim();
  const content = els.contentInput.value.trim();
  const section = els.sectionInput.value;
  const tags = parseTags(els.tagsInput.value);
  const evidenceUrl = els.evidenceInput.value.trim();
  const attachmentFile = els.attachmentInput.files[0] || null;

  if (!validateComposer()) {
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
  commitMutation(`카드 추가: ${title}`, () => {
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
  });

  els.titleInput.value = "";
  els.contentInput.value = "";
  els.tagsInput.value = "";
  els.evidenceInput.value = "";
  els.attachmentInput.value = "";
  els.addPostBtn.disabled = false;
  els.addPostBtn.textContent = "카드 추가";
  setComposerFeedback(`"${title}" 카드를 추가했습니다.`, "success");
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
  const attachment = normalizeAttachment({
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    uploadedAt: new Date().toISOString(),
    storageProvider: "indexeddb",
    localOnly: true,
  });
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

  commitMutation(`섹션 추가: ${nextSection}`, () => {
    shared.sections.push(nextSection);
  });
  els.newSectionInput.value = "";
}

function createTemplatePost(templatePost) {
  const position = getNextCanvasPosition();
  return {
    id: crypto.randomUUID(),
    title: templatePost.title,
    content: templatePost.content,
    tags: templatePost.tags || [],
    section: templatePost.section,
    type: templatePost.type,
    priority: templatePost.priority,
    status: templatePost.status,
    moderationStatus: "live",
    evidenceUrl: "",
    attachments: [],
    createdAt: new Date().toISOString(),
    x: position.x,
    y: position.y,
    reactions: { like: 0, insight: 0, risk: 0 },
    comments: [],
    authorName: profile.name,
  };
}

function applyTemplate(templateId) {
  if (!canEditBoard()) return;
  const template = BOARD_TEMPLATES.find((item) => item.id === templateId);
  if (!template) return;

  const ok = confirm(`"${template.title}" 템플릿 카드 ${template.posts.length}개를 추가할까요?`);
  if (!ok) return;

  prefs.activeSection = "All";
  persistPrefs();
  commitMutation(`템플릿 적용: ${template.title}`, () => {
    template.sections.forEach((section) => {
      if (!shared.sections.includes(section)) shared.sections.push(section);
    });
    template.posts.forEach((post) => {
      shared.posts.push(createTemplatePost(post));
    });
  });
}

async function copyShareLink() {
  if (!canReadBoard()) return;
  const link = createAccessLink(accessRole);
  await copyTextWithAlert(link, cloud.ready
    ? "현재 보드 링크를 복사했습니다. 같은 Supabase 설정을 쓰는 환경에서 같은 보드를 불러옵니다."
    : "현재 보드 링크를 복사했습니다. Supabase 연결 전에는 데이터가 이 브라우저 안에만 있습니다.");
}

async function copyAccessLink(role) {
  if (!canReadBoard()) return;
  const link = createAccessLink(role);
  await copyTextWithAlert(link, role === "view"
    ? "읽기 전용 링크를 복사했습니다."
    : "편집 링크를 복사했습니다.");
}

async function copyTextWithAlert(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    alert(successMessage);
  } catch {
    alert(`복사 실패. 수동으로 복사하세요: ${text}`);
  }
}

async function reloadCloudConflictVersion() {
  if (!hasCloudConflict() || !cloud.client) return;

  try {
    updateSaveStatus("Cloud loading", "syncing");
    const row = cloud.conflict.remoteRow || await fetchCloudRow();
    const loaded = await loadCloudRow(row, "Cloud reloaded");
    if (!loaded) throw new Error("원격 보드를 불러올 수 없습니다.");
  } catch (error) {
    cloud.lastError = error.message || "원격 불러오기 실패";
    updateSaveStatus("Cloud error", "error");
    renderControls();
  }
}

function keepLocalConflictVersion() {
  if (!hasCloudConflict()) return;

  clearCloudConflict();
  cloud.ready = false;
  cloud.lastError = "원격 변경이 있어 로컬 버전을 유지합니다.";
  updateSaveStatus("Local kept", "warning");
  renderControls();
}

async function backupAndOverwriteCloudConflict() {
  if (!hasCloudConflict() || !canReadBoard()) return;

  try {
    await exportBackup();
    clearCloudConflict();
    cloud.ready = true;
    await saveCloudSnapshot({ force: true });
  } catch (error) {
    cloud.lastError = error.message || "백업 후 덮어쓰기 실패";
    updateSaveStatus("Cloud error", "error");
    renderControls();
  }
}

function exportCsv() {
  if (!canReadBoard()) return;
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
  if (!canReadBoard()) return;
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
  if (!canEditBoard()) {
    els.importBackupInput.value = "";
    return;
  }

  try {
    const text = await file.text();
    const backup = JSON.parse(text);
    if (!backup?.shared?.posts) throw new Error("Boardly 백업 파일이 아닙니다.");

    const before = cloneSharedState();
    shared = normalizeSharedState(backup.shared);
    prefs = normalizePrefs(backup.prefs);
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
    undoStack.push({ label: "백업 복원", snapshot: before });
    addActivity("백업 복원");
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

  commitMutation("데모 초기화", () => {
    shared = normalizeSharedState(structuredClone(defaultSharedState));
    prefs = structuredClone(defaultPrefs);
    persistPrefs();
  });
}

async function deletePost(postId) {
  const post = shared.posts.find((item) => item.id === postId);
  if (!post) return;

  const ok = confirm(`"${post.title}" 카드를 삭제할까요? 되돌리기를 누르면 다시 복구할 수 있습니다.`);
  if (!ok) return;

  commitMutation(`카드 삭제: ${post.title}`, () => {
    shared.posts = shared.posts.filter((item) => item.id !== postId);
  });
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

    const nextX = Math.max(0, event.clientX - boardRect.left - drag.offsetX);
    const nextY = Math.max(0, event.clientY - boardRect.top - drag.offsetY);
    drag.id = null;
    commitMutation(`카드 이동: ${post.title}`, () => {
      const target = findPost(post.id);
      if (!target) return;
      target.x = nextX;
      target.y = nextY;
    });
  });
}

function setupEvents() {
  els.addPostBtn.addEventListener("click", () => void addPost());
  els.addSectionBtn.addEventListener("click", addSection);
  els.copyLinkBtn.addEventListener("click", copyShareLink);
  els.copyViewLinkBtn.addEventListener("click", () => void copyAccessLink("view"));
  els.copyEditLinkBtn.addEventListener("click", () => void copyAccessLink("edit"));
  els.conflictReloadBtn.addEventListener("click", () => void reloadCloudConflictVersion());
  els.conflictKeepLocalBtn.addEventListener("click", keepLocalConflictVersion);
  els.conflictBackupOverwriteBtn.addEventListener("click", () => void backupAndOverwriteCloudConflict());
  els.exportCsvBtn.addEventListener("click", exportCsv);
  els.exportBackupBtn.addEventListener("click", () => void exportBackup());
  els.resetDemoBtn.addEventListener("click", () => void resetDemo());
  els.undoBtn.addEventListener("click", undoLastAction);
  els.importBackupInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) void importBackup(file);
  });

  [els.titleInput, els.contentInput].forEach((input) => {
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") setFieldValidity(input, Boolean(input.value.trim()));
      if (els.formFeedback.classList.contains("error")) {
        setComposerFeedback("제목과 내용만 적으면 바로 추가할 수 있습니다. Ctrl/⌘ + Enter로 저장합니다.");
      }
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        void addPost();
      }
    });
  });

  [els.closeEditBtn, els.cancelEditBtn].forEach((btn) => {
    btn.addEventListener("click", closeEditDrawer);
  });

  els.saveEditBtn.addEventListener("click", () => void saveEditedPost());

  els.editOverlay.addEventListener("click", (event) => {
    if (event.target === els.editOverlay) closeEditDrawer();
  });

  [els.editTitleInput, els.editContentInput].forEach((input) => {
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") setEditFieldValidity(input, Boolean(input.value.trim()));
      if (els.editFeedback.classList.contains("error")) {
        setEditFeedback("수정 내용을 저장하면 보드에 바로 반영됩니다.");
      }
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        void saveEditedPost();
      }
    });
  });

  els.editAttachmentInput.addEventListener("change", () => {
    const file = els.editAttachmentInput.files[0];
    if (!file) return;
    setEditFeedback(`${file.name} 파일이 선택됐습니다. 저장하면 첨부됩니다.`);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.editOverlay.hidden) closeEditDrawer();
  });

  els.layoutOptions.forEach((btn) => {
    btn.addEventListener("click", () => {
      shared.layout = btn.dataset.layout;
      persistAndRender();
    });
  });

  els.quickFilterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filterId = btn.dataset.quickFilter;
      if (!QUICK_FILTERS.some((filter) => filter.id === filterId)) return;

      prefs.quickFilters = prefs.quickFilters.includes(filterId)
        ? prefs.quickFilters.filter((id) => id !== filterId)
        : [...prefs.quickFilters, filterId];
      persistPrefs();
      render();
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
  resetComposerValidation();
  validateAccessToken();
  render();
  persistBoardSnapshot({ syncCloud: false });
  void initializeCloudSync();
}

bootstrap();
