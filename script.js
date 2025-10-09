async function initializeTracker() {
  try {
    // Get the path from the URL, e.g., "/t/12345-abcde"
    const path = window.location.pathname.split('/');
    console.log('Current path:', path);
    
    // Get the last part of the path, which is our unique ID
    const projectId = path[path.length - 1];

  // If there's no ID, show an error.
  if (!projectId || path[1] !== 't') {
    document.body.innerHTML = '<h1>Project not found</h1><p>Please use a valid tracker link.</p>';
    return;
  }

  try {
    console.log('Fetching project data for ID:', projectId);
    // Call our new dynamic API endpoint
    const response = await fetch(`/api/project/${projectId}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // Log the raw response for debugging
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    // Try to parse as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      throw new Error('Invalid response from server');
    }
    
    if (!response.ok) {
      console.error('API Error:', responseData);
      throw new Error(responseData.message || 'Failed to fetch project data');
    }

    console.log('API Response:', responseData);
    const { projectData, workflowStages, comments } = responseData;
    
    // Render all components with the fetched data
    renderProgressBar(workflowStages, projectData.status);
    renderTimeline(projectData, comments);
    renderProjectInfo(projectData);

  } catch (error) {
    // ... (Your error handling) ...
  }
});

// The render functions below do not need to be changed.
// ... (rest of the file is the same) ...

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