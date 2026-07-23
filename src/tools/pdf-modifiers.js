import { Toast, Progress, downloadBlob, setupDropZone, showLoading, hideLoading } from '../ui/core.js';
import { createToolSetup } from '../core/router.js';

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
            Toast.success(`Successfully merged ${mergeFiles.length} PDFs!`);
        } catch (error) {
            console.error(error);
            Toast.error("An error occurred while merging PDFs.");
        } finally {
            hideLoading();
        }
    });
}

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
            Toast.error("An error occurred while splitting PDF.");
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
                Toast.warning("No pages selected to remove.");
                hideLoading();
                return;
            }
            if (pagesToRemove.size >= totalPages) {
                Toast.warning("You cannot remove all pages from the document.");
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
            Toast.error("An error occurred while removing pages.");
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

export { setupMergeTool, setupSplitTool, setupRemoveTool, setupExtractTool, setupRotateTool, setupRearrangeTool };
