document.addEventListener('DOMContentLoaded', function () {
    const projectData = {
        projectId: "PROJ-101",
        projectName: "New Website Redesign",
        clientName: "Innovate Corp.",
        status: "Client Review",
        stages: ["Onboarding", "Discovery & Strategy", "Design", "Development", "Client Review", "Launch"],
        timeline: [
            { status: "Client Review", description: "Initial designs sent to client for feedback.", timestamp: "2025-10-08T10:00:00Z" },
            { status: "Development", description: "Development phase completed.", timestamp: "2025-10-06T17:30:00Z" },
            { status: "Design", description: "Wireframes and mockups approved.", timestamp: "2025-09-28T11:00:00Z" },
            { status: "Discovery & Strategy", description: "Project kickoff meeting held.", timestamp: "2025-09-20T09:00:00Z" },
            { status: "Onboarding", description: "Contract signed and project created.", timestamp: "2025-09-18T15:45:00Z" }
        ]
    };

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
    
    function renderProjectInfo(data) {
        const infoSection = document.getElementById('project-info');
        infoSection.innerHTML = `<h2>Project Information</h2><p><strong>Project ID:</strong> ${data.projectId}</p><p><strong>Project Name:</strong> ${data.projectName}</p><p><strong>Client:</strong> ${data.clientName}</p>`;
    }

    function renderTimeline(timeline, currentStatus) {
        const list = document.getElementById('timeline-list');
        const heading = document.getElementById('current-status-heading');
        heading.textContent = `Delivered: ${currentStatus}`;
        list.innerHTML = '';
        timeline.forEach(item => {
            const listItem = document.createElement('li');
            listItem.classList.add('timeline-item');
            const date = new Date(item.timestamp).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});
            listItem.innerHTML = `<span class="timeline-date">${date}</span><p class="timeline-description"><strong>[${item.status}]</strong> ${item.description}</p>`;
            list.appendChild(listItem);
        });
    }

    renderProgressBar(projectData.stages, projectData.status);
    renderProjectInfo(projectData);
    renderTimeline(projectData.timeline, projectData.status);
});