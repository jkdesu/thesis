// UI: build one card element
function createProjectCard(project) {
  const card = document.createElement("a");
  card.className = "project-card";
  card.href = project.href;

  const number = document.createElement("span");
  number.className = "project-number";
  number.textContent = project.number;

  const title = document.createElement("h2");
  title.textContent = project.title;

  const tag = document.createElement("span");
  tag.className = "project-tag";
  tag.textContent = project.tag;

  const description = document.createElement("p");
  description.className = "project-desc";
  description.textContent = project.description;

  const enter = document.createElement("span");
  enter.className = "project-enter";
  enter.textContent = "Enter Exhibition ->";

  card.append(number, title, tag, description, enter);
  return card;
}

function createExhibitionPanel(project) {
  const panel = document.createElement("article");
  panel.className = "exhibition-panel";

  const slot = document.createElement("div");
  slot.className = "panel-card-slot";
  slot.appendChild(createProjectCard(project));

  panel.appendChild(slot);
  return panel;
}

// Render: insert all project cards into gallery
function renderGallery() {
  const gallery = document.getElementById("gallery");
  if (!gallery) return;
  PROJECTS.forEach((project) => {
    gallery.appendChild(createExhibitionPanel(project));
  });
}

// Utility: set current year in footer
function setYear() {
  const year = document.getElementById("year");
  if (!year) return;
  year.textContent = new Date().getFullYear();
}

// App start
renderGallery();
setYear();
