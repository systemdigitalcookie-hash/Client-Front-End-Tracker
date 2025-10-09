document.addEventListener('DOMContentLoaded', async function () {
  
  try {
    const response = await fetch('/api/notion');
    const { projectData, workflowStages, comments } = await response.json();

    if (!projectData) {
      const errorPayload = await response.json();
      document.body.innerHTML = `<p>Error loading data: ${errorPayload.error || 'No project data returned'}</p>`;
      return;
    }

    renderProjectInfo(projectData);
    renderProgressBar(workflowStages, projectData.status); 
    renderTimeline(projectData, comments);

  } catch (error) {
    console.error('Failed to fetch project data:', error);
    document.body.innerHTML = `<p>Error loading data. See console for details.</p>`;
  }
});

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

function renderTimeline(data, comments) {
    const list = document.getElementById('timeline-list');
    const heading = document.getElementById('current-status-heading');
    heading.textContent = `Current Status: ${data.status}`;

    if (comments && comments.length > 0) {
        list.innerHTML = comments.map(comment => {
            const date = new Date(comment.timestamp).toLocaleString('en-US', { 
                year: 'numeric', month: 'short', day: 'numeric', 
                hour: '2-digit', minute: '2-digit'
            });
            return `
                <li class="timeline-item">
                    <span class="timeline-date">${date}</span>
                    <p class="timeline-description">${comment.text}</p>
                </li>
            `;
        }).join('');
    } else {
        list.innerHTML = `
            <li class="timeline-item">
                <p class="timeline-description">No progress updates found.</p>
            </li>
        `;
    }
}

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