document.addEventListener('DOMContentLoaded', async function () {
  
  try {
    // This now calls our renamed serverless function.
    const response = await fetch('/api/notion');
    const projectData = await response.json();

    if (projectData.error) {
      console.error(projectData.error);
      document.body.innerHTML = `<p>Error loading data: ${projectData.error}</p>`;
      return;
    }

    renderProjectInfo(projectData);
    renderStaticProgressBar(projectData.status); 
    renderStaticTimeline(projectData);

  } catch (error) {
    console.error('Failed to fetch project data:', error);
    document.body.innerHTML = `<p>Error loading data. See console for details.</p>`;
  }
});

// --- RENDER FUNCTIONS --- (These are all unchanged)

function renderProjectInfo(data) {
    const infoSection = document.getElementById('project-info');
    infoSection.innerHTML = `
        <h2>Project Information</h2>
        <p><strong>Project Name:</strong> ${data.projectName}</p>
        <p><strong>Client:</strong> ${data.clientName}</p>
        <p><strong>Contact Email:</strong> ${data.email || 'N/A'}</p>
        <p><strong>Timeline Start:</strong> ${data.timeline ? new Date(data.timeline).toLocaleDateString() : 'Not set'}</p>
        <p><strong>Documents:</strong> ${data.documentCount} file(s) uploaded</p>
    `;
}

function renderStaticProgressBar(currentStatus) {
    const stages = ["Onboarding", "In Progress", "Client Review", "Completed"];
    const bar = document.getElementById('progress-bar');
    bar.innerHTML = '';
    const currentStageIndex = stages.indexOf(currentStatus);

    stages.forEach((stage, index) => {
        const step = document.createElement('div');
        step.classList.add('step');
        if (index < currentStageIndex) {
            step.classList.add('completed');
        } else if (index === currentStageIndex) {
            step.classList.add('active');
        }
        step.innerHTML = `<div class="step-icon">${index < currentStageIndex ? '✓' : ''}</div><div class="step-label">${stage}</div>`;
        bar.appendChild(step);
    });
}

function renderStaticTimeline(data) {
    const list = document.getElementById('timeline-list');
    const heading = document.getElementById('current-status-heading');
    heading.textContent = `Current Status: ${data.status}`;
    list.innerHTML = `
      <li class="timeline-item">
        <span class="timeline-date">${new Date().toLocaleString()}</span>
        <p class="timeline-description"><strong>[Data Loaded]</strong> Successfully fetched the latest item from Notion.</p>
      </li>
    `;
}