// import projects.json
// import projects from "./projects.json" assert { type: "json" };
// import * as projects from "./projects.json";

const projectItemArea = document.querySelector(".project-items");
const pageChannelsArea = document.querySelector(".page-channels");
const pageLoadingSpinner = document.querySelector(".page-loading-spinner");

const pageContentFrame = document.querySelector(".page-content-iframe");
const pageContent = document.querySelector(".page-content");
const sideInfo = document.querySelector(".side-info");
const mobileHeader = document.querySelector(".mobile-header");
const toggleSideButton = document.querySelector(".toggle-collapse-sidebar");
const mobileHeaderTitle = document.querySelector(".mobile-header-channel-name");

let urlParams = new URLSearchParams(window.location.search);
let urlProjectId = urlParams.get("project") ?? 0;
let urlChannelName = urlParams.get("channel") ?? "";
console.log(urlProjectId, urlChannelName);

const css = `
<link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@200;400;500;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="${window.origin}/general.css" />
    <link rel="stylesheet" href="${window.origin}/style.css" />
`;

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
let currentSelectedProject = null;

// log which script is running
console.log(`script.js is running`);

await PopulateProjects();
AddEventListeners();

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
  ClickOnProjectItem(urlProjectId);
}

function ClickOnProjectItem(projectId) {
  // remove selected class from all projects
  const allProjectItems = document.querySelectorAll(".project-item");
  allProjectItems.forEach((projectItem) => {
    projectItem.classList.remove("project-item-selected");
  });

  // add selected class to clicked project
  const projectItem = document.querySelector(`[data-id="${projectId}"]`);
  projectItem.classList.add("project-item-selected");

  currentSelectedProject = projects[projectId];

  // set url params
  urlParams.set("project", projectId);
  window.history.replaceState({}, "", `${location.pathname}?${urlParams}`);
  urlProjectId = projectId;

  PopulateChannels(projectId);
}

async function PopulateChannels(projectId) {
  const project = projects[projectId];
  const channelType = project.channelType;

  pageChannelsArea.innerHTML = "";
  if (channelType === "single-page") {
    await PopulateChannels_SinglePage(projectId);
  } else if (channelType === "multi-page") {
    await PopulateChannels_MultiPage(projectId);
  }

  // click on first channel
  const foundChannel = document.querySelector(
    `[data-channel-name="${urlChannelName}"]`
  );
  const firstChannel = document.querySelector(".page-channel");
  ClickOnChannel(foundChannel || firstChannel);
}

async function PopulateChannels_SinglePage(projectId) {
  const project = projects[projectId];
  const projectSourcePage = project.source;
  if (!projectSourcePage) return;

  const content = await SetPageContentFromSource(projectSourcePage);
  const singlePageLinks = FindLinksInContent(content);
  singlePageLinks.forEach((link) => {
    const div = AddChannelDiv(
      projectId,
      {
        name: link,
      },
      0,
      link
    );
  });
}
async function PopulateChannels_MultiPage(projectId) {
  const project = projects[projectId];
  project.channels.forEach((channel, i) => {
    AddChannelDiv(projectId, channel, i);
  });
}

function AddChannelDiv(projectId, channel, i = 0, linkName = "") {
  const { name: channelName } = channel;

  const markup = `
    <a 
    href="#${linkName}"
    class="page-channel" 
    data-channel-name="${channelName}" 
    data-channel-id="${i}"
    data-project-id="${projectId}">
      ${hashSvg}
      <p class="channel-name">${channelName}</p>
    </a>
    `;

  pageChannelsArea.insertAdjacentHTML("beforeend", markup);

  return pageChannelsArea.lastElementChild;
}

function FindLinksInContent(content) {
  // only find href links that start with # and are followed by a word
  const links = content.match(/(?<=href="#)\w+/g);

  if (!links) {
    console.error(`Project has no links. Please add links to the project.`);
    return null;
  }

  // return links without duplicates
  return [...new Set(links)];
}

async function ClickOnChannel(pageChannel) {
  // remove selected class from all channels
  const allPageChannels = document.querySelectorAll(".page-channel");
  allPageChannels.forEach((channel) => {
    channel.classList.remove("page-channel-selected");
  });

  // add selected class to clicked channel
  pageChannel.classList.add("page-channel-selected");

  if (!currentSelectedProject)
    currentSelectedProject = projects[pageChannel.dataset.projectId];

  if (currentSelectedProject.channelType === "single-page") {
    // scroll page content to .page-channel link
    const link = pageChannel.getAttribute("href");
    const linkElement =
      pageContentFrame.contentWindow.document.body.querySelector(`${link}`);
    if (linkElement) {
      pageContentFrame.contentWindow.scrollTo({
        top: linkElement.offsetTop,
        behavior: "smooth",
      });
    } else {
      console.error(`Link ${link} does not exist.`);
    }
  } else if (currentSelectedProject.channelType === "multi-page") {
    const project = projects[pageChannel.dataset.projectId];
    const channelId = pageChannel.dataset.channelId;
    const channelContent = project.channels[channelId].content;

    mobileHeaderTitle.textContent = pageChannel.dataset.channelName;

    if (channelContent === "") {
      const contentSrc = project.channels[channelId].source;
      SetPageContentFromSource(contentSrc);
    } else {
      ChangePageContent(channelContent);
    }
  }

  // set url channel params
  urlParams.set("channel", pageChannel.dataset.channelName);
  window.history.replaceState({}, "", `${location.pathname}?${urlParams}`);
  urlChannelName = pageChannel.dataset.channelName;
}

async function SetPageContentFromSource(source) {
  pageLoadingSpinner.classList.remove("hidden"); // show loading spinner

  pageContentFrame.src = source;
  const data = await new Promise((resolve) => {
    pageContentFrame.addEventListener("load", () => {
      const data = pageContentFrame.contentWindow.document.body.innerHTML;
      resolve(data);
      pageLoadingSpinner.classList.add("hidden"); // hide loading spinner
    });
  });
  return data;
}

function ChangePageContent(content) {
  pageLoadingSpinner.classList.remove("hidden"); // show loading spinner
  // create src link for content
  // Create a blob containing the HTML content
  const blob = new Blob([css + content], { type: "text/html" });

  // Generate a URL for the blob
  const blobURL = URL.createObjectURL(blob);

  // Set the iframe src to the blob URL
  pageContentFrame.src = blobURL;
  pageContentFrame.onload = () => {
    pageLoadingSpinner.classList.add("hidden"); // hide loading spinner
  };

  // Revoke the blob URL later when no longer needed
  // (e.g. on unload)
  URL.revokeObjectURL(blobURL);
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
    e.preventDefault();
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
