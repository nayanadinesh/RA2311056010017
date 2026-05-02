const listElement = document.getElementById("notificationList");
const detailContent = document.getElementById("detailContent");
const statusText = document.getElementById("statusText");
const refreshBtn = document.getElementById("refreshBtn");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");
const typeButtons = document.querySelectorAll(".stat-box");
const allCount = document.getElementById("allCount");
const placementCount = document.getElementById("placementCount");
const resultCount = document.getElementById("resultCount");
const eventCount = document.getElementById("eventCount");
const updatedTime = document.getElementById("updatedTime");
const visibleCount = document.getElementById("visibleCount");

let notifications = [];
let selectedId = "";
let currentFilter = "all";
let currentType = "all";
let readIds = JSON.parse(localStorage.getItem("readIds") || "[]");
let deletedIds = JSON.parse(localStorage.getItem("deletedIds") || "[]");

function saveLocalState() {
  localStorage.setItem("readIds", JSON.stringify(readIds));
  localStorage.setItem("deletedIds", JSON.stringify(deletedIds));
}

function getTypeClass(type) {
  return `type-${type.toLowerCase()}`;
}

function getIcon(type) {
  if (type === "Placement") {
    return "P";
  }

  if (type === "Result") {
    return "R";
  }

  return "E";
}

function getTitle(notification) {
  return `${notification.Type} Update`;
}

function isImportant(notification) {
  return notification.Type === "Placement";
}

function isRead(notification) {
  return readIds.includes(notification.ID);
}

function formatTime(timeValue) {
  return new Date(timeValue).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getVisibleBaseItems() {
  return notifications.filter((item) => !deletedIds.includes(item.ID));
}

function setCounts() {
  const activeItems = getVisibleBaseItems();

  allCount.textContent = activeItems.length;
  placementCount.textContent = activeItems.filter((item) => item.Type === "Placement").length;
  resultCount.textContent = activeItems.filter((item) => item.Type === "Result").length;
  eventCount.textContent = activeItems.filter((item) => item.Type === "Event").length;
}

function getFilteredNotifications() {
  const searchText = searchInput.value.trim().toLowerCase();

  return getVisibleBaseItems().filter((notification) => {
    if (currentType !== "all" && notification.Type !== currentType) {
      return false;
    }

    if (currentFilter === "unread" && isRead(notification)) {
      return false;
    }

    if (currentFilter === "important" && !isImportant(notification)) {
      return false;
    }

    const searchableText = [
      notification.Type,
      notification.Message,
      notification.Timestamp,
      notification.priorityScore,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(searchText);
  });
}

function renderDetail(notification) {
  if (!notification) {
    detailContent.innerHTML = `
      <p class="eyebrow">Selected</p>
      <h2>No notification selected</h2>
      <p class="muted">Choose a notification card to view the full details.</p>
    `;
    return;
  }

  const readStatus = isRead(notification) ? "Read" : "Unread";
  const importantText = isImportant(notification) ? "Yes" : "No";

  detailContent.innerHTML = `
    <div class="detail-icon ${getTypeClass(notification.Type)}">${getIcon(notification.Type)}</div>
    <div>
      <p class="eyebrow">${notification.Type}</p>
      <h2>${getTitle(notification)}</h2>
    </div>
    <p class="detail-message">${notification.Message}</p>
    <div class="detail-grid">
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span class="detail-value">${readStatus}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Important</span>
        <span class="detail-value">${importantText}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Timestamp</span>
        <span class="detail-value">${notification.Timestamp}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Priority score</span>
        <span class="detail-value">${notification.priorityScore}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">ID</span>
        <span class="detail-value">${notification.ID}</span>
      </div>
    </div>
  `;
}

function renderNotifications() {
  const visibleNotifications = getFilteredNotifications();
  const selectedNotification = visibleNotifications.find((item) => item.ID === selectedId);

  if (!selectedNotification && visibleNotifications.length > 0) {
    selectedId = visibleNotifications[0].ID;
  }

  listElement.innerHTML = "";
  visibleCount.textContent = `${visibleNotifications.length} shown`;

  if (!visibleNotifications.length) {
    selectedId = "";
    listElement.innerHTML = '<p class="empty-state">No notifications match this view.</p>';
    renderDetail(null);
    return;
  }

  visibleNotifications.forEach((notification, index) => {
    const read = isRead(notification);
    const card = document.createElement("article");
    card.className = `notification-card ${read ? "read" : "unread"} ${
      notification.ID === selectedId ? "selected" : ""
    }`;
    card.dataset.id = notification.ID;

    card.innerHTML = `
      <div class="avatar ${getTypeClass(notification.Type)}">${getIcon(notification.Type)}</div>
      <div class="card-main">
        <div class="card-topline">
          <span class="card-title">${index + 1}. ${getTitle(notification)}</span>
          <span class="type-badge ${getTypeClass(notification.Type)}">${notification.Type}</span>
          <span class="status-badge ${read ? "read" : "unread"}">${read ? "Read" : "Unread"}</span>
          ${isImportant(notification) ? '<span class="important-badge">Important</span>' : ""}
        </div>
        <p class="message-preview">${notification.Message}</p>
        <div class="card-meta">
          <span>${notification.Timestamp}</span>
          <span>Score: ${notification.priorityScore}</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="card-btn read-btn" type="button" data-action="read" data-id="${notification.ID}">
          ${read ? "Mark unread" : "Mark read"}
        </button>
        <button class="card-btn delete-btn" type="button" data-action="delete" data-id="${notification.ID}">
          Delete
        </button>
      </div>
    `;

    listElement.appendChild(card);
  });

  renderDetail(visibleNotifications.find((item) => item.ID === selectedId));
}

function updateDashboard(data) {
  notifications = data.notifications || [];
  setCounts();
  updatedTime.textContent = data.updatedAt ? formatTime(data.updatedAt) : "--";
  statusText.textContent = `${notifications.length} priority notifications loaded`;
  renderNotifications();
}

async function loadNotifications() {
  try {
    refreshBtn.disabled = true;
    statusText.textContent = "Loading priority notifications";

    const response = await fetch("/api/priority-notifications");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    updateDashboard(data);
  } catch (error) {
    listElement.innerHTML = `<p class="empty-state">${error.message}</p>`;
    visibleCount.textContent = "0 shown";
    statusText.textContent = "Could not load notifications";
    renderDetail(null);
  } finally {
    refreshBtn.disabled = false;
  }
}

function handleCardClick(event) {
  const button = event.target.closest("button");
  const card = event.target.closest(".notification-card");

  if (!card) {
    return;
  }

  selectedId = card.dataset.id;

  if (button) {
    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "read") {
      if (readIds.includes(id)) {
        readIds = readIds.filter((readId) => readId !== id);
      } else {
        readIds.push(id);
      }
    }

    if (action === "delete") {
      deletedIds.push(id);
      selectedId = "";
    }

    saveLocalState();
    setCounts();
  }

  renderNotifications();
}

function setFilter(event) {
  currentFilter = event.target.dataset.filter;

  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === currentFilter);
  });

  renderNotifications();
}

function setTypeFilter(event) {
  currentType = event.currentTarget.dataset.type;

  typeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.type === currentType);
  });

  renderNotifications();
}

refreshBtn.addEventListener("click", loadNotifications);
searchInput.addEventListener("input", renderNotifications);
listElement.addEventListener("click", handleCardClick);
filterButtons.forEach((button) => button.addEventListener("click", setFilter));
typeButtons.forEach((button) => button.addEventListener("click", setTypeFilter));

loadNotifications();
