document.addEventListener('DOMContentLoaded', async function () {

  try {
    const response = await fetch('/api/notion');
    const { projectData, workflowStages } = await response.json();

    if (!projectData) {
      console.error("Error loading data:", data.error);
      document.body.innerHTML = `<p>Error loading data: ${data.error}</p>`;
      return;
    }

    renderProjectInfo(projectData);
    renderProgressBar(workflowStages, projectData.status); 
    renderStaticTimeline(projectData);

  } catch (error) {
    console.error('Failed to fetch project data:', error);
    document.body.innerHTML = `<p>Error loading data. See console for details.</p>`;
  }
});

function renderProjectInfo(data) {
    const infoSection = document.getElementById('project-info');

    let documentsHtml = '<p><strong>Documents:</strong> No files uploaded</p>';
    if (data.documents && data.documents.length > 0) {
        documentsHtml = `
            <p><strong>Documents:</strong></p>
            <ul class="documents-list">
                ${data.documents.map(doc => `
                    <li>
                        <a href="${doc.url}" target="_blank" rel="noopener noreferrer">
                            📎 ${doc.name}
                        </a>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    infoSection.innerHTML = `
        <h2>Project Information</h2>
        <p><strong>Project Name:</strong> ${data.projectName}</p>
        <p><strong>Client:</strong> ${data.clientName}</p>
        <p><strong>Contact Email:</strong> ${data.email || 'N/A'}</p>
        <p><strong>Timeline Start:</strong> ${data.timeline ? new Date(data.timeline).toLocaleDateString() : 'Not set'}</p>
        ${documentsHtml}
    `;
}

function renderProgressBar(stages, currentStatus) {
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