import { Toast, Progress, setupDropZone, showLoading, hideLoading } from '../ui/core.js';
import { createToolSetup } from '../core/router.js';

let summarizer = null;

async function initAI() {
    if (!summarizer) {
        Progress.show(false);
        Progress.update(10, 'Downloading AI Model (approx. 40MB) - First time only...');
        
        try {
            // Using Xenova's DistilBART for fast CPU summarization
            summarizer = await window.pipeline('summarization', 'Xenova/distilbart-cnn-6-6', {
                progress_callback: (x) => {
                    if (x.status === 'downloading') {
                        // rough estimate for progress
                        let p = x.progress || 0;
                        Progress.update(10 + p * 0.8, `Downloading AI Model: ${x.file} (${Math.round(p)}%)`);
                    }
                }
            });
            Toast.success('AI Model loaded successfully!');
        } catch (err) {
            console.error(err);
            Toast.error('Failed to load AI model. Please check console.');
            throw err;
        } finally {
            Progress.hide();
        }
    }
}

export function setupAiTool() {
    createToolSetup('ai', async (file) => {
        // Step 1: Extract Text using PDF.js
        Progress.show(false);
        Progress.update(10, 'Reading PDF document...');
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        let fullText = "";
        const maxPages = Math.min(pdf.numPages, 10); // Limit to 10 pages for summarization to avoid context window explosion
        
        for (let i = 1; i <= maxPages; i++) {
            Progress.update(10 + (i / maxPages) * 30, `Extracting text from page ${i}...`);
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + " ";
        }
        
        if (fullText.trim().length < 50) {
            Toast.warning('Not enough text found in this PDF to summarize.');
            Progress.hide();
            return;
        }

        // Step 2: Initialize AI Model
        await initAI();

        // Step 3: Summarize
        Progress.show(false);
        Progress.update(60, 'AI is summarizing the document...');
        
        try {
            // We only summarize the first N words to fit context
            const chunk = fullText.slice(0, 3000); 
            
            const result = await summarizer(chunk, {
                max_new_tokens: 150,
                min_new_tokens: 40
            });
            
            Progress.update(100, 'Done!');
            
            document.getElementById('ai-result-container').classList.remove('hidden');
            document.getElementById('ai-result-text').innerText = result[0].summary_text;
            Toast.success('Summarization complete!');
            
        } catch (error) {
            console.error('Summarize error:', error);
            Toast.error('AI Error: ' + error.message);
        } finally {
            Progress.hide();
        }
    });
}
