document.addEventListener('DOMContentLoaded', async function () {
  
  try {
    const response = await fetch('/api/notion');
    // Destructure the new 'comments' array from the response
    const { projectData, comments } = await response.json();

    if (!projectData) {
      const errorPayload = await response.json();
      console.error("Error loading data:", errorPayload.error || 'No project data returned');
      document.body.innerHTML = `<p>Error loading data: ${errorPayload.error || 'No project data returned'}</p>`;
      return;
    }

    renderProjectInfo(projectData);
    // This part requires a separate API call to get all stages, which we will skip for now.
    // We will build a simplified progress bar.
    renderSimpleProgressBar(projectData.status); 
    renderTimeline(projectData, comments); // Pass the comments to the timeline function

  } catch (error) {
    console.error('Failed to fetch project data:', error);
    document.body.innerHTML = `<p>Error loading data. See console for details.</p>`;
  }
});

// A simplified progress bar as the dynamic stages requires another API call
function renderSimpleProgressBar(currentStatus) {
    const bar = document.getElementById('progress-bar');
    // For simplicity, we'll just show the current status as a single active step
    bar.innerHTML = `
        <div class="step active">
            <div class="step-icon"></div>
            <div class="step-label">${currentStatus}</div>
        </div>
    `;
}

// Rewritten to display the list of comments
function renderTimeline(data, comments) {
    const list = document.getElementById('timeline-list');
    const heading = document.getElementById('current-status-heading');
    heading.textContent = `Current Status: ${data.status}`;

    if (comments && comments.length > 0) {
        list.innerHTML = comments.map(comment => {
            const date = new Date(comment.timestamp).toLocaleString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit'
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

// --- Other Render Functions (unchanged) ---

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