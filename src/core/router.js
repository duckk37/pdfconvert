import { showLoading, hideLoading } from '../ui/core.js';

function navigateTo(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');
    window.scrollTo(0, 0);
}

function renderDashboard() {
    const grid = document.getElementById('tools-grid');
    grid.innerHTML = '';
    
    toolsList.forEach(tool => {
        const card = document.createElement('div');
        card.className = `tool-card ${tool.active ? '' : 'disabled'}`;
        card.innerHTML = `
            <i class="fa-solid star-icon fa-star"></i>
            <i class="fa-solid ${tool.icon} tool-icon"></i>
            <span>${tool.name}</span>
        `;
        
        if (tool.active) {
            card.onclick = () => navigateTo(tool.id);
        }
        
        grid.appendChild(card);
    });
}





function createToolSetup(toolId, onProcess) {
    let currentFile = null;
    const dropZone = document.getElementById(`${toolId}-drop-zone`);
    const fileInput = document.getElementById(`${toolId}-file-input`);
    const previewArea = document.getElementById(`${toolId}-preview-area`);
    const fileNameDisplay = document.getElementById(`${toolId}-file-name`);
    const actionBar = document.getElementById(`${toolId}-action-bar`);
    const btnDo = document.getElementById(`btn-do-${toolId}`);

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => handleFile(e.dataTransfer.files[0]), false);
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

    function handleFile(file) {
        if (!file || file.type !== 'application/pdf') return;
        currentFile = file;
        dropZone.style.display = 'none';
        previewArea.style.display = 'block';
        fileNameDisplay.innerHTML = `<i class="fa-solid fa-file-pdf" style="color:#ff5252"></i> ${file.name}`;
        actionBar.classList.remove('hidden');
    }

    btnDo.addEventListener('click', async () => {
        if (!currentFile) return;
        showLoading();
        try {
            await onProcess(currentFile);
        } catch (error) {
            console.error(error);
            Toast.error(`An error occurred: ${error.message}`);
        } finally {
            hideLoading();
            currentFile = null;
            dropZone.style.display = 'block';
            previewArea.style.display = 'none';
            actionBar.classList.add('hidden');
        }
    });
}

export { navigateTo, renderDashboard, setupSingleFileInput, setupMultipleFileInput, createToolSetup };
