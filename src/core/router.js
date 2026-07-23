import { showLoading, hideLoading } from '../ui/core.js';

function navigateTo(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');
    window.scrollTo(0, 0);
}

const toolsList = [
    { id: 'merge', name: 'Merge PDF', icon: 'fa-object-group', active: true },
    { id: 'split', name: 'Split PDF', icon: 'fa-scissors', active: true },
    { id: 'compress', name: 'Compress PDF', icon: 'fa-compress', active: false },
    { id: 'edit', name: 'Edit PDF', icon: 'fa-pen', active: false },
    { id: 'sign', name: 'Sign PDF', icon: 'fa-file-signature', active: true },
    { id: 'converter', name: 'Word to PDF', icon: 'fa-file-word', active: true },
    { id: 'img2pdf', name: 'Images to PDF', icon: 'fa-image', active: true },
    { id: 'scanner', name: 'Camera Scanner', icon: 'fa-camera', active: true },
    { id: 'pdf2img', name: 'PDF to Images', icon: 'fa-images', active: true },
    { id: 'extract-img', name: 'Extract PDF images', icon: 'fa-image-portrait', active: true },
    { id: 'protect', name: 'Protect PDF', icon: 'fa-lock', active: true },
    { id: 'unlock', name: 'Unlock PDF', icon: 'fa-unlock', active: true },
    { id: 'rotate', name: 'Rotate PDF pages', icon: 'fa-rotate-right', active: true },
    { id: 'remove', name: 'Remove PDF pages', icon: 'fa-trash', active: true },
    { id: 'extract', name: 'Extract PDF pages', icon: 'fa-file-export', active: true },
    { id: 'rearrange', name: 'Rearrange PDF pages', icon: 'fa-layer-group', active: true },
    { id: 'web2pdf', name: 'Webpage to PDF', icon: 'fa-globe', active: false },
    { id: 'ocr', name: 'PDF OCR', icon: 'fa-language', active: true },
    { id: 'watermark', name: 'Add watermark', icon: 'fa-droplet', active: true },
    { id: 'pagenum', name: 'Add page numbers', icon: 'fa-list-ol', active: true },
    { id: 'ai-summarize', name: 'AI Summarize', icon: 'fa-robot', active: true },
    { id: 'overlay', name: 'PDF Overlay', icon: 'fa-clone', active: false },
    { id: 'compare', name: 'Compare PDFs', icon: 'fa-code-compare', active: false },
    { id: 'optimize', name: 'Web optimize PDF', icon: 'fa-gauge-high', active: false },
    { id: 'redact', name: 'Redact PDF', icon: 'fa-eraser', active: false },
    { id: 'create', name: 'Create PDF', icon: 'fa-file-circle-plus', active: false }
];

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
