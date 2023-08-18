// import projects.json
// import projects from "./projects.json" assert { type: "json" };
// import * as projects from "./projects.json";

const projectItemArea = document.querySelector(".project-items");
const pageChannelsArea = document.querySelector(".page-channels");

const pageContent = document.querySelector(".page-content");
const sideInfo = document.querySelector(".side-info");
const mobileHeader = document.querySelector(".mobile-header");
const toggleSideButton = document.querySelector(".toggle-collapse-sidebar");
const mobileHeaderTitle = document.querySelector(".mobile-header-channel-name");

let hashSvg = `
<svg
  class="channel-icon"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
  <g
    id="SVGRepo_tracerCarrier"
    stroke-linecap="round"
    stroke-linejoin="round"
  ></g>
  <g id="SVGRepo_iconCarrier">
    <path
      d="M10 4L7 20M17 4L14 20M5 8H20M4 16H19"
      stroke="#ffffff"
      stroke-width="2"
      stroke-linecap="round"
    ></path>
  </g>
</svg>
`;

let sideBarOpen = false;
let projects = [];

AddEventListeners();
await PopulateProjects();

async function PopulateProjects() {
  const getProjects = await fetch("./projects.json");
  projects = await getProjects.json();

  projects.forEach((project, i) => {
    const projectName = project.name;
    const projectImageSrc = project.image;

    const projectItemMarkup = `
    <div class="project-item" data-project-name="${projectName}" data-id="${i}">
      <div class="project-image-container">
        <img
          src="${projectImageSrc}"
          alt="image for ${projectName}"
        />
      </div>
      <div class="project-item-hover-element"></div>
      <div class="project-item-name-hover">
        <p>${projectName}</p>
      </div>
    </div>
  `;
    projectItemArea.insertAdjacentHTML("beforeend", projectItemMarkup);
  });

  // click on first project
  ClickOnProjectItem(0);
}

function ClickOnProjectItem(index) {
  // remove selected class from all projects
  const allProjectItems = document.querySelectorAll(".project-item");
  allProjectItems.forEach((projectItem) => {
    projectItem.classList.remove("project-item-selected");
  });

  // add selected class to clicked project
  const projectItem = document.querySelector(`[data-id="${index}"]`);
  projectItem.classList.add("project-item-selected");

  pageChannelsArea.innerHTML = "";
  const project = projects[index];

  project.channels.forEach((channel, i) => {
    const channelName = channel.name;

    const markup = `
    <div class="page-channel" data-channel-name="${channelName}" 
    data-channel-id="${i}"
    data-project-id="${index}">
      ${hashSvg}
      <p class="channel-name">${channelName}</p>
    </div>
    `;

    pageChannelsArea.insertAdjacentHTML("beforeend", markup);
  });

  // click on first channel
  const firstChannel = pageChannelsArea.querySelector(".page-channel");
  ClickOnChannel(firstChannel, 0);
}

function ClickOnChannel(pageChannel) {
  // show loading animation
  pageContent.innerHTML = `<div class="lds-ring"><div></div><div></div><div></div><div></div></div>`;

  // remove selected class from all channels
  const allPageChannels = document.querySelectorAll(".page-channel");
  allPageChannels.forEach((channel) => {
    channel.classList.remove("page-channel-selected");
  });

  // add selected class to clicked channel
  pageChannel.classList.add("page-channel-selected");

  mobileHeaderTitle.textContent = pageChannel.dataset.channelName;

  const channelContent =
    projects[pageChannel.dataset.projectId].channels[
      pageChannel.dataset.channelId
    ].content;

  if (channelContent === "") {
    const contentSrc =
      projects[pageChannel.dataset.projectId].channels[
        pageChannel.dataset.channelId
      ].source;

    // read file with the name of the source
    fetch(contentSrc)
      .then((response) => response.text())
      .then((data) => {
        pageContent.innerHTML = data;
      });
  } else {
    pageContent.innerHTML = channelContent;
  }
}

function AddEventListeners() {
  // clicking on a project
  projectItemArea.addEventListener("click", (e) => {
    const projectItem = e.target.closest(".project-item");
    if (!projectItem) return;

    if (projectItem.classList.contains("project-item-selected")) return;
    ClickOnProjectItem(projectItem.dataset.id);
  });

  // clicking on a channel
  pageChannelsArea.addEventListener("click", (e) => {
    const pageChannel = e.target.closest(".page-channel");
    if (!pageChannel) return;

    ClickOnChannel(pageChannel);
  });

  // click outside of sidebar will close it / click on toggle button will open it
  document.addEventListener("click", (e) => {
    if (sideBarOpen) {
      const isClickInside = e.target.closest(".side-info");
      if (isClickInside) return;

      ToggleSidebar();
    } else {
      const toggleSideButton = e.target.closest(".toggle-collapse-sidebar");
      if (!toggleSideButton) return;

      ToggleSidebar();
    }
  });
}

function ToggleSidebar() {
  sideInfo.classList.toggle("side-info--collapsed-left", sideBarOpen);
  pageContent.classList.toggle("side-info--collapsed-right", sideBarOpen);
  mobileHeader.classList.toggle("side-info--collapsed-right", sideBarOpen);
  sideBarOpen = !sideBarOpen;
}
