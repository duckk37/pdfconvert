import { Toast, Progress, downloadBlob, setupDropZone, showLoading, hideLoading } from '../ui/core.js';
import { createToolSetup } from '../core/router.js';

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
            Toast.error("An error occurred while converting images.");
        } finally {
            hideLoading();
        }
    });
}

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

        // Show progress bar for multi-page rendering
        Progress.show(true);
        Progress.update(0, `Rendering page 1 of ${totalPages}...`);

        for (let i = 1; i <= totalPages; i++) {
            Progress.update((i / totalPages) * 100, `Rendering page ${i} of ${totalPages}...`);
            
            const page = await pdfDoc.getPage(i);
            const scale = 2.0;
            const viewport = page.getViewport({ scale: scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
            downloadBlob(blob, `${file.name.replace('.pdf', '')}_page_${i}.jpg`);
            
            // Release canvas memory immediately
            canvas.width = 0;
            canvas.height = 0;
            
            await new Promise(r => setTimeout(r, 500));
        }

        Toast.success(`Extracted ${totalPages} pages as images!`);
    });
}

function setupConverterTool() {
    let currentFile = null;
    const fileInput = document.getElementById('converter-file-input');
    const dropZone = document.getElementById('converter-drop-zone');

    function handleConverterFile(file) {
        if (!file) return;
        currentFile = file;
        dropZone.style.display = 'none';
        document.getElementById('converter-preview-area').style.display = 'block';
        document.getElementById('converter-file-name').textContent = currentFile.name;
        document.getElementById('converter-action-bar').classList.remove('hidden');
    }

    setupDropZone(dropZone, fileInput, handleConverterFile);

    document.getElementById('btn-do-converter').addEventListener('click', async () => {
        if (!currentFile || typeof mammoth === 'undefined' || typeof html2pdf === 'undefined') {
            Toast.error("Required libraries are not loaded or file is missing.");
            return;
        }
        showLoading();
        try {
            const result = await mammoth.convertToHtml({ arrayBuffer: await currentFile.arrayBuffer() });
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = result.value;
            tempDiv.style.cssText = 'padding:40px;background:#fff;color:#000;';
            document.body.appendChild(tempDiv);
            await html2pdf().set({
                margin: 1,
                filename: currentFile.name.replace('.docx', '.pdf'),
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            }).from(tempDiv).save();
            document.body.removeChild(tempDiv);
            Toast.success('DOCX converted to PDF successfully!');
            currentFile = null;
            dropZone.style.display = 'block';
            document.getElementById('converter-preview-area').style.display = 'none';
            document.getElementById('converter-action-bar').classList.add('hidden');
        } catch (error) {
            console.error(error);
            Toast.error("Error converting DOCX: " + error.message);
        } finally {
            hideLoading();
        }
    });
}

function setupExtractImgTool() {
    createToolSetup('extract-img', async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const totalPages = pdf.numPages;

        Progress.show(true);
        Progress.update(0, `Extracting page 1 of ${totalPages}...`);

        for (let i = 1; i <= totalPages; i++) {
            Progress.update((i / totalPages) * 100, `Extracting page ${i} of ${totalPages}...`);
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.9));
            downloadBlob(blob, `extracted_page_${i}.jpg`);
            canvas.width = 0;
            canvas.height = 0;
            await new Promise(r => setTimeout(r, 300));
        }
        Toast.success(`Extracted ${totalPages} images from PDF!`);
    });
}

export { setupImg2pdfTool, setupPdf2imgTool, setupConverterTool, setupExtractImgTool };
