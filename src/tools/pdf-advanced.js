import { Toast, Progress, downloadBlob, setupDropZone, showLoading, hideLoading } from '../ui/core.js';
import { createToolSetup } from '../core/router.js';

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
            Toast.error("Cannot access the camera. Please ensure permissions are granted.");
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
            Toast.error("An error occurred while creating the PDF.");
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

function setupSignTool() {
    let currentFile = null;
    const canvas = document.getElementById('signature-pad');
    const ctx = canvas.getContext('2d');
    let isDrawing = false;

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const startDrawing = (e) => { isDrawing = true; const pos = getPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); e.preventDefault(); };
    const draw = (e) => { if (!isDrawing) return; const pos = getPos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); e.preventDefault(); };
    const stopDrawing = () => { isDrawing = false; ctx.closePath(); };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);

    document.getElementById('btn-clear-signature').addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    const fileInput = document.getElementById('sign-file-input');
    const dropZone = document.getElementById('sign-drop-zone');

    function handleSignFile(file) {
        if (!file) return;
        currentFile = file;
        dropZone.style.display = 'none';
        document.getElementById('sign-preview-area').style.display = 'block';
        document.getElementById('sign-file-name').textContent = currentFile.name;
        document.getElementById('sign-action-bar').classList.remove('hidden');
    }

    setupDropZone(dropZone, fileInput, handleSignFile);

    document.getElementById('btn-do-sign').addEventListener('click', async () => {
        if (!currentFile) return;
        const blank = document.createElement('canvas');
        blank.width = canvas.width;
        blank.height = canvas.height;
        if (canvas.toDataURL() === blank.toDataURL()) {
            Toast.warning("Please draw your signature first.");
            return;
        }
        showLoading();
        try {
            const { PDFDocument } = PDFLib;
            const pdfDoc = await PDFDocument.load(await currentFile.arrayBuffer());
            const pngImage = await pdfDoc.embedPng(canvas.toDataURL('image/png'));
            const firstPage = pdfDoc.getPages()[0];
            const dims = firstPage.getSize();
            firstPage.drawImage(pngImage, {
                x: dims.width - 220, y: 50,
                width: 200, height: 200 * (pngImage.height / pngImage.width),
            });
            const blob = new Blob([await pdfDoc.save()], { type: 'application/pdf' });
            downloadBlob(blob, `signed_${currentFile.name}`);
            Toast.success('PDF signed successfully!');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            currentFile = null;
            dropZone.style.display = 'block';
            document.getElementById('sign-preview-area').style.display = 'none';
            document.getElementById('sign-action-bar').classList.add('hidden');
        } catch (error) {
            console.error(error);
            Toast.error("Error signing PDF: " + error.message);
        } finally {
            hideLoading();
        }
    });
}

function setupOcrTool() {
    let currentFile = null;
    const fileInput = document.getElementById('ocr-file-input');
    const dropZone = document.getElementById('ocr-drop-zone');

    function handleOcrFile(file) {
        if (!file) return;
        currentFile = file;
        dropZone.style.display = 'none';
        document.getElementById('ocr-preview-area').style.display = 'block';
        document.getElementById('ocr-file-name').textContent = currentFile.name;
        document.getElementById('ocr-action-bar').classList.remove('hidden');
        document.getElementById('ocr-result-container').classList.add('hidden');
    }

    setupDropZone(dropZone, fileInput, handleOcrFile);

    document.getElementById('btn-do-ocr').addEventListener('click', async () => {
        if (!currentFile || typeof Tesseract === 'undefined') {
            Toast.error("Tesseract.js is not loaded or file is missing.");
            return;
        }
        Progress.show(true);
        Progress.update(5, 'Initializing OCR engine...');
        try {
            const lang = document.getElementById('ocr-language').value;
            let imageSource = currentFile;

            if (currentFile.type === 'application/pdf') {
                Progress.update(10, 'Rendering PDF page...');
                const pdf = await pdfjsLib.getDocument(await currentFile.arrayBuffer()).promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                imageSource = canvas.toDataURL('image/jpeg');
                canvas.width = 0;
                canvas.height = 0;
            }

            Progress.update(30, 'Loading AI model...');
            const worker = await Tesseract.createWorker(lang, 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        Progress.update(30 + m.progress * 65, `Recognizing text... ${Math.round(m.progress * 100)}%`);
                    } else if (m.status) {
                        Progress.update(30, m.status);
                    }
                }
            });
            const ret = await worker.recognize(imageSource);
            await worker.terminate();

            Progress.update(100, 'Done!');
            document.getElementById('ocr-result-container').classList.remove('hidden');
            document.getElementById('ocr-result-text').value = ret.data.text;
            Toast.success('Text recognition complete!');
        } catch (error) {
            console.error(error);
            Toast.error("Error running OCR: " + error.message);
        } finally {
            Progress.hide();
        }
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

export { setupScannerTool, setupSignTool, setupOcrTool, setupPagenumTool };
