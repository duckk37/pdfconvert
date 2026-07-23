const toolsList = [
    { id: 'merge', name: 'Merge PDF', icon: 'fa-object-group', active: true },
    { id: 'split', name: 'Split PDF', icon: 'fa-scissors', active: true },
    { id: 'compress', name: 'Compress PDF', icon: 'fa-compress', active: false },
    { id: 'edit', name: 'Edit PDF', icon: 'fa-pen', active: false },
    { id: 'sign', name: 'Sign PDF', icon: 'fa-file-signature', active: false },
    { id: 'converter', name: 'PDF Converter', icon: 'fa-rotate', active: false },
    { id: 'img2pdf', name: 'Images to PDF', icon: 'fa-image', active: true },
    { id: 'scanner', name: 'Camera Scanner', icon: 'fa-camera', active: true },
    { id: 'pdf2img', name: 'PDF to Images', icon: 'fa-images', active: true },
    { id: 'extract-img', name: 'Extract PDF images', icon: 'fa-image-portrait', active: false },
    { id: 'protect', name: 'Protect PDF', icon: 'fa-lock', active: true },
    { id: 'unlock', name: 'Unlock PDF', icon: 'fa-unlock', active: true },
    { id: 'rotate', name: 'Rotate PDF pages', icon: 'fa-rotate-right', active: true },
    { id: 'remove', name: 'Remove PDF pages', icon: 'fa-trash', active: true },
    { id: 'extract', name: 'Extract PDF pages', icon: 'fa-file-export', active: true },
    { id: 'rearrange', name: 'Rearrange PDF pages', icon: 'fa-layer-group', active: true },
    { id: 'web2pdf', name: 'Webpage to PDF', icon: 'fa-globe', active: false },
    { id: 'ocr', name: 'PDF OCR', icon: 'fa-file-word', active: false },
    { id: 'watermark', name: 'Add watermark', icon: 'fa-droplet', active: true },
    { id: 'pagenum', name: 'Add page numbers', icon: 'fa-list-ol', active: true },
    { id: 'overlay', name: 'PDF Overlay', icon: 'fa-clone', active: false },
    { id: 'compare', name: 'Compare PDFs', icon: 'fa-code-compare', active: false },
    { id: 'optimize', name: 'Web optimize PDF', icon: 'fa-gauge-high', active: false },
    { id: 'redact', name: 'Redact PDF', icon: 'fa-eraser', active: false },
    { id: 'create', name: 'Create PDF', icon: 'fa-file-circle-plus', active: false }
];

// Navigation
function navigateTo(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');
    window.scrollTo(0, 0);
}

// Render Dashboard
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

// Global UI helpers
function showLoading() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ==========================================
// MERGE PDF LOGIC
// ==========================================
let mergeFiles = [];

function setupMergeTool() {
    const dropZone = document.getElementById('merge-drop-zone');
    const fileInput = document.getElementById('merge-file-input');
    const fileList = document.getElementById('merge-file-list');
    const actionBar = document.getElementById('merge-action-bar');
    const btnMerge = document.getElementById('btn-do-merge');

    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        handleMergeFiles(e.dataTransfer.files);
    }, false);

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => handleMergeFiles(fileInput.files));

    function handleMergeFiles(files) {
        for (let i = 0; i < files.length; i++) {
            if (files[i].type === 'application/pdf') {
                mergeFiles.push(files[i]);
            }
        }
        renderMergeFileList();
    }

    function renderMergeFileList() {
        fileList.innerHTML = '';
        mergeFiles.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = `
                <div class="file-name">
                    <i class="fa-solid fa-file-pdf"></i> ${file.name}
                </div>
                <button class="remove-btn" onclick="removeMergeFile(${index})">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            fileList.appendChild(item);
        });

        if (mergeFiles.length > 1) {
            actionBar.classList.remove('hidden');
        } else {
            actionBar.classList.add('hidden');
        }
    }

    window.removeMergeFile = (index) => {
        mergeFiles.splice(index, 1);
        renderMergeFileList();
    };

    btnMerge.addEventListener('click', async () => {
        if (mergeFiles.length < 2) return;
        showLoading();
        
        try {
            const { PDFDocument } = PDFLib;
            const mergedPdf = await PDFDocument.create();

            for (const file of mergeFiles) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const mergedPdfFile = await mergedPdf.save();
            const blob = new Blob([mergedPdfFile], { type: 'application/pdf' });
            downloadBlob(blob, 'merged_document.pdf');
        } catch (error) {
            console.error(error);
            alert("An error occurred while merging PDFs.");
        } finally {
            hideLoading();
        }
    });
}

// ==========================================
// SPLIT PDF LOGIC
// ==========================================
let splitFile = null;

function setupSplitTool() {
    const dropZone = document.getElementById('split-drop-zone');
    const fileInput = document.getElementById('split-file-input');
    const previewArea = document.getElementById('split-preview-area');
    const fileNameDisplay = document.getElementById('split-file-name');
    const actionBar = document.getElementById('split-action-bar');
    const btnSplit = document.getElementById('btn-do-split');
    const splitEveryInput = document.getElementById('split-every-pages');

    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => handleSplitFile(e.dataTransfer.files[0]), false);
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => handleSplitFile(fileInput.files[0]));

    function handleSplitFile(file) {
        if (!file || file.type !== 'application/pdf') return;
        splitFile = file;
        dropZone.style.display = 'none';
        previewArea.style.display = 'block';
        fileNameDisplay.innerHTML = `<i class="fa-solid fa-file-pdf" style="color:#ff5252"></i> ${file.name}`;
        actionBar.classList.remove('hidden');
    }

    btnSplit.addEventListener('click', async () => {
        if (!splitFile) return;
        showLoading();
        
        try {
            const { PDFDocument } = PDFLib;
            const arrayBuffer = await splitFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();
            const pagesPerSplit = parseInt(splitEveryInput.value, 10);

            if (pagesPerSplit < 1) throw new Error("Invalid pages per split");

            // Split logic
            for (let i = 0; i < totalPages; i += pagesPerSplit) {
                const end = Math.min(i + pagesPerSplit, totalPages);
                const newPdf = await PDFDocument.create();
                
                // Get page indices for this chunk
                const indices = [];
                for(let j = i; j < end; j++) indices.push(j);

                const copiedPages = await newPdf.copyPages(pdfDoc, indices);
                copiedPages.forEach((page) => newPdf.addPage(page));

                const pdfBytes = await newPdf.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                
                // Download each part
                const baseName = splitFile.name.replace('.pdf', '');
                downloadBlob(blob, `${baseName}_part_${(i/pagesPerSplit)+1}.pdf`);
                
                // Small delay to allow browser to process multiple downloads
                await new Promise(r => setTimeout(r, 500));
            }

        } catch (error) {
            console.error(error);
            alert("An error occurred while splitting PDF.");
        } finally {
            hideLoading();
            // Reset state
            splitFile = null;
            dropZone.style.display = 'block';
            previewArea.style.display = 'none';
            actionBar.classList.add('hidden');
        }
    });
}

// ==========================================
// REMOVE PDF PAGES LOGIC
// ==========================================
let removeFile = null;
let pagesToRemove = new Set(); // Stores 1-indexed page numbers

function setupRemoveTool() {
    const dropZone = document.getElementById('remove-drop-zone');
    const fileInput = document.getElementById('remove-file-input');
    const previewArea = document.getElementById('remove-preview-area');
    const fileNameDisplay = document.getElementById('remove-file-name');
    const actionBar = document.getElementById('remove-action-bar');
    const btnRemove = document.getElementById('btn-do-remove');
    const pageGrid = document.getElementById('remove-page-grid');

    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => handleRemoveFile(e.dataTransfer.files[0]), false);
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => handleRemoveFile(fileInput.files[0]));

    async function handleRemoveFile(file) {
        if (!file || file.type !== 'application/pdf') return;
        removeFile = file;
        pagesToRemove.clear();
        dropZone.style.display = 'none';
        previewArea.style.display = 'block';
        fileNameDisplay.innerHTML = `<i class="fa-solid fa-file-pdf" style="color:#ff5252"></i> ${file.name} <span style="margin-left: 10px; font-size:14px; color:var(--text-muted);">(Loading preview...)</span>`;
        actionBar.classList.add('hidden');
        pageGrid.innerHTML = '';

        try {
            // Initialize PDF.js worker
            if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            }

            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
            const pdfDoc = await loadingTask.promise;
            const totalPages = pdfDoc.numPages;

            fileNameDisplay.innerHTML = `<i class="fa-solid fa-file-pdf" style="color:#ff5252"></i> ${file.name}`;

            for (let i = 1; i <= totalPages; i++) {
                const pageItem = document.createElement('div');
                pageItem.className = 'page-item';
                pageItem.innerHTML = `<span class="page-number">Page ${i}</span>`;
                
                const canvas = document.createElement('canvas');
                pageItem.insertBefore(canvas, pageItem.firstChild);
                pageGrid.appendChild(pageItem);

                pageItem.onclick = () => {
                    if (pagesToRemove.has(i)) {
                        pagesToRemove.delete(i);
                        pageItem.classList.remove('selected');
                    } else {
                        pagesToRemove.add(i);
                        pageItem.classList.add('selected');
                    }
                };

                const page = await pdfDoc.getPage(i);
                const scale = 0.5; // low scale for thumbnail
                const viewport = page.getViewport({ scale: scale });

                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };

                page.render(renderContext); // Non-blocking render
            }

            actionBar.classList.remove('hidden');

        } catch (error) {
            console.error("Error generating thumbnails", error);
            fileNameDisplay.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:#fa5252"></i> Could not load preview for ${file.name}`;
            actionBar.classList.remove('hidden'); // still allow removing even if preview fails
        }
    }

    btnRemove.addEventListener('click', async () => {
        if (!removeFile) return;

        showLoading();
        
        try {
            const { PDFDocument } = PDFLib;
            const arrayBuffer = await removeFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();
            
            if (pagesToRemove.size === 0) {
                alert("No pages selected to remove.");
                hideLoading();
                return;
            }
            if (pagesToRemove.size >= totalPages) {
                alert("You cannot remove all pages from the document.");
                hideLoading();
                return;
            }

            const newPdf = await PDFDocument.create();
            const indicesToKeep = [];
            for (let i = 1; i <= totalPages; i++) {
                if (!pagesToRemove.has(i)) {
                    indicesToKeep.push(i - 1); // 0-indexed
                }
            }

            const copiedPages = await newPdf.copyPages(pdfDoc, indicesToKeep);
            copiedPages.forEach((page) => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            
            const baseName = removeFile.name.replace('.pdf', '');
            downloadBlob(blob, `${baseName}_removed.pdf`);

        } catch (error) {
            console.error(error);
            alert("An error occurred while removing pages.");
        } finally {
            hideLoading();
            // Reset state
            removeFile = null;
            pagesToRemove.clear();
            pageGrid.innerHTML = '';
            dropZone.style.display = 'block';
            previewArea.style.display = 'none';
            actionBar.classList.add('hidden');
        }
    });
}

// ==========================================
// NEW TOOLS LOGIC (Extract, Rotate, Protect, Watermark, Pagenum)
// ==========================================

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
            alert(`An error occurred: ${error.message}`);
        } finally {
            hideLoading();
            currentFile = null;
            dropZone.style.display = 'block';
            previewArea.style.display = 'none';
            actionBar.classList.add('hidden');
        }
    });
}

function parsePagesString(str, maxPages) {
    const pages = new Set();
    const parts = str.split(',');
    for (let part of parts) {
        part = part.trim();
        if (!part) continue;
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) {
                    if (i >= 1 && i <= maxPages) pages.add(i);
                }
            }
        } else {
            const page = parseInt(part, 10);
            if (!isNaN(page) && page >= 1 && page <= maxPages) {
                pages.add(page);
            }
        }
    }
    return pages;
}

function setupExtractTool() {
    createToolSetup('extract', async (file) => {
        const inputStr = document.getElementById('extract-pages-input').value.trim();
        if (!inputStr) throw new Error("Please specify pages to extract.");
        
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        const totalPages = pdfDoc.getPageCount();
        const pagesToExtract = parsePagesString(inputStr, totalPages);
        
        if (pagesToExtract.size === 0) throw new Error("No valid pages specified.");
        
        const newPdf = await PDFDocument.create();
        const indicesToKeep = Array.from(pagesToExtract).map(p => p - 1);
        const copiedPages = await newPdf.copyPages(pdfDoc, indicesToKeep);
        copiedPages.forEach((page) => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        downloadBlob(blob, `${file.name.replace('.pdf', '')}_extracted.pdf`);
        document.getElementById('extract-pages-input').value = '';
    });
}

function setupRotateTool() {
    createToolSetup('rotate', async (file) => {
        const angle = parseInt(document.querySelector('input[name="rotate-angle"]:checked').value, 10);
        
        const { PDFDocument, degrees } = PDFLib;
        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        
        const pages = pdfDoc.getPages();
        pages.forEach(page => {
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees(currentRotation + angle));
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        downloadBlob(blob, `${file.name.replace('.pdf', '')}_rotated.pdf`);
    });
}

function setupProtectTool() {
    createToolSetup('protect', async (file) => {
        const password = document.getElementById('protect-password-input').value;
        if (!password) throw new Error("Please enter a password.");

        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        
        const pdfBytes = await pdfDoc.save({
            userPassword: password,
            ownerPassword: password,
        });

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        downloadBlob(blob, `${file.name.replace('.pdf', '')}_protected.pdf`);
        document.getElementById('protect-password-input').value = '';
    });
}

function setupWatermarkTool() {
    createToolSetup('watermark', async (file) => {
        const text = document.getElementById('watermark-text-input').value || "Confidential";

        const { PDFDocument, rgb, degrees, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        const pages = pdfDoc.getPages();
        pages.forEach(page => {
            const { width, height } = page.getSize();
            page.drawText(text, {
                x: width / 2 - (text.length * 20) / 2, // Approx center
                y: height / 2,
                size: 50,
                font: helveticaFont,
                color: rgb(0.7, 0.7, 0.7),
                opacity: 0.3,
                rotate: degrees(45),
            });
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        downloadBlob(blob, `${file.name.replace('.pdf', '')}_watermarked.pdf`);
        document.getElementById('watermark-text-input').value = '';
    });
}

function setupPagenumTool() {
    createToolSetup('pagenum', async (file) => {
        const { PDFDocument, rgb, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        const pages = pdfDoc.getPages();
        pages.forEach((page, index) => {
            const { width } = page.getSize();
            const text = `${index + 1}`;
            page.drawText(text, {
                x: width / 2 - 5,
                y: 20,
                size: 12,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        downloadBlob(blob, `${file.name.replace('.pdf', '')}_numbered.pdf`);
    });
}

function setupUnlockTool() {
    createToolSetup('unlock', async (file) => {
        const password = document.getElementById('unlock-password-input').value;
        if (!password) throw new Error("Please enter the current password to unlock.");

        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(await file.arrayBuffer(), { password });
        
        const pdfBytes = await pdfDoc.save(); // Saves without password by default unless specified
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        downloadBlob(blob, `${file.name.replace('.pdf', '')}_unlocked.pdf`);
        document.getElementById('unlock-password-input').value = '';
    });
}

function setupRearrangeTool() {
    createToolSetup('rearrange', async (file) => {
        const inputStr = document.getElementById('rearrange-pages-input').value.trim();
        if (!inputStr) throw new Error("Please specify the new page order.");
        
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
        const totalPages = pdfDoc.getPageCount();
        
        // Parse "3, 1, 2, 4-5" into array of page indices
        const newOrder = [];
        const parts = inputStr.split(',');
        for (let part of parts) {
            part = part.trim();
            if (!part) continue;
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) {
                        if (i >= 1 && i <= totalPages) newOrder.push(i - 1);
                    }
                }
            } else {
                const page = parseInt(part, 10);
                if (!isNaN(page) && page >= 1 && page <= totalPages) {
                    newOrder.push(page - 1);
                }
            }
        }
        
        if (newOrder.length === 0) throw new Error("Invalid page order specified.");
        
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, newOrder);
        copiedPages.forEach((page) => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        downloadBlob(blob, `${file.name.replace('.pdf', '')}_rearranged.pdf`);
        document.getElementById('rearrange-pages-input').value = '';
    });
}

// ==========================================
// IMAGES TO PDF LOGIC
// ==========================================
let img2pdfFiles = [];

function setupImg2pdfTool() {
    const dropZone = document.getElementById('img2pdf-drop-zone');
    const fileInput = document.getElementById('img2pdf-file-input');
    const fileList = document.getElementById('img2pdf-file-list');
    const actionBar = document.getElementById('img2pdf-action-bar');
    const btnDo = document.getElementById('btn-do-img2pdf');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files), false);
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));

    function handleFiles(files) {
        for (let i = 0; i < files.length; i++) {
            if (files[i].type.startsWith('image/')) {
                img2pdfFiles.push(files[i]);
            }
        }
        renderFileList();
    }

    function renderFileList() {
        fileList.innerHTML = '';
        img2pdfFiles.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = `
                <div class="file-name">
                    <i class="fa-solid fa-image" style="color:#339af0"></i> ${file.name}
                </div>
                <button class="remove-btn" onclick="removeImg2pdfFile(${index})">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            fileList.appendChild(item);
        });

        if (img2pdfFiles.length > 0) {
            actionBar.classList.remove('hidden');
        } else {
            actionBar.classList.add('hidden');
        }
    }

    window.removeImg2pdfFile = (index) => {
        img2pdfFiles.splice(index, 1);
        renderFileList();
    };

    btnDo.addEventListener('click', async () => {
        if (img2pdfFiles.length === 0) return;
        showLoading();
        
        try {
            const { PDFDocument } = PDFLib;
            const pdfDoc = await PDFDocument.create();

            for (const file of img2pdfFiles) {
                const arrayBuffer = await file.arrayBuffer();
                let image;
                if (file.type === 'image/jpeg') {
                    image = await pdfDoc.embedJpg(arrayBuffer);
                } else if (file.type === 'image/png') {
                    image = await pdfDoc.embedPng(arrayBuffer);
                } else {
                    continue; // Skip unsupported image types
                }
                
                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            downloadBlob(blob, 'images_converted.pdf');
        } catch (error) {
            console.error(error);
            alert("An error occurred while converting images.");
        } finally {
            hideLoading();
        }
    });
}

// ==========================================
// PDF TO IMAGES LOGIC
// ==========================================

function setupPdf2imgTool() {
    createToolSetup('pdf2img', async (file) => {
        // Initialize PDF.js worker
        if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;
        const totalPages = pdfDoc.numPages;

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdfDoc.getPage(i);
            const scale = 2.0; // Higher scale for better quality
            const viewport = page.getViewport({ scale: scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            await page.render(renderContext).promise;

            // Convert canvas to blob and download
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
            downloadBlob(blob, `${file.name.replace('.pdf', '')}_page_${i}.jpg`);
            
            // Small delay to prevent browser from blocking multiple downloads
            await new Promise(r => setTimeout(r, 500));
        }
    });
}

// ==========================================
// CAMERA SCANNER LOGIC
// ==========================================
let scannerFrames = [];
let cameraStream = null;

function setupScannerTool() {
    const btnStartCamera = document.getElementById('btn-start-camera');
    const scannerSetup = document.getElementById('scanner-setup');
    const scannerActive = document.getElementById('scanner-active');
    const video = document.getElementById('scanner-video');
    const btnCapture = document.getElementById('btn-capture-frame');
    const frameList = document.getElementById('scanner-frame-list');
    const actionBar = document.getElementById('scanner-action-bar');
    const btnDoScanner = document.getElementById('btn-do-scanner');

    btnStartCamera.addEventListener('click', async () => {
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment" } 
            });
            video.srcObject = cameraStream;
            scannerSetup.style.display = 'none';
            scannerActive.style.display = 'block';
        } catch (error) {
            console.error("Error accessing camera: ", error);
            alert("Cannot access the camera. Please ensure permissions are granted.");
        }
    });

    btnCapture.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to Data URL (base64) for preview and later PDF generation
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        scannerFrames.push(dataUrl);
        renderScannerFrames();
    });

    function renderScannerFrames() {
        frameList.innerHTML = '';
        scannerFrames.forEach((frame, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.style.justifyContent = 'space-between';
            item.innerHTML = `
                <div style="display:flex; align-items:center;">
                    <img src="${frame}" style="height:40px; width:auto; border-radius:4px; margin-right:10px;">
                    <span>Scanned Page ${index + 1}</span>
                </div>
                <button class="remove-btn" onclick="removeScannerFrame(${index})">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            frameList.appendChild(item);
        });

        if (scannerFrames.length > 0) {
            actionBar.classList.remove('hidden');
        } else {
            actionBar.classList.add('hidden');
        }
    }

    window.removeScannerFrame = (index) => {
        scannerFrames.splice(index, 1);
        renderScannerFrames();
    };

    btnDoScanner.addEventListener('click', async () => {
        if (scannerFrames.length === 0) return;
        showLoading();
        
        try {
            const { PDFDocument } = PDFLib;
            const pdfDoc = await PDFDocument.create();

            for (const dataUrl of scannerFrames) {
                // Fetch the base64 string and convert to ArrayBuffer
                const res = await fetch(dataUrl);
                const arrayBuffer = await res.arrayBuffer();
                
                const image = await pdfDoc.embedJpg(arrayBuffer);
                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            downloadBlob(blob, 'scanned_document.pdf');
            
            // Clean up
            scannerFrames = [];
            renderScannerFrames();
        } catch (error) {
            console.error(error);
            alert("An error occurred while creating the PDF.");
        } finally {
            hideLoading();
        }
    });

    // Cleanup camera when switching tools
    const originalNavigateTo = window.navigateTo || function(){};
    window.navigateTo = function(toolId) {
        if (toolId !== 'scanner' && cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
            scannerSetup.style.display = 'block';
            scannerActive.style.display = 'none';
            video.srcObject = null;
        }
        originalNavigateTo(toolId);
    };
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderDashboard();
    setupMergeTool();
    setupSplitTool();
    setupRemoveTool();
    setupExtractTool();
    setupRotateTool();
    setupProtectTool();
    setupWatermarkTool();
    setupPagenumTool();
    setupUnlockTool();
    setupRearrangeTool();
    setupImg2pdfTool();
    setupPdf2imgTool();
    setupScannerTool();
});
