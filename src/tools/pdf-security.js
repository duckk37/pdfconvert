import { Toast, Progress, downloadBlob, setupDropZone, showLoading, hideLoading } from '../ui/core.js';
import { createToolSetup } from '../core/router.js';

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

export { setupProtectTool, setupUnlockTool, setupWatermarkTool };
