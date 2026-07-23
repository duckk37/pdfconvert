import { renderDashboard, navigateTo } from './core/router.js';
import { setupMergeTool, setupSplitTool, setupRemoveTool, setupExtractTool, setupRotateTool, setupRearrangeTool } from './tools/pdf-modifiers.js';
import { setupProtectTool, setupUnlockTool, setupWatermarkTool } from './tools/pdf-security.js';
import { setupImg2pdfTool, setupPdf2imgTool, setupConverterTool, setupExtractImgTool } from './tools/pdf-converters.js';
import { setupScannerTool, setupSignTool, setupOcrTool, setupPagenumTool } from './tools/pdf-advanced.js';

window.navigateTo = navigateTo;

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
    setupExtractImgTool();
    setupConverterTool();
    
    setupScannerTool();
    setupSignTool();
    setupOcrTool();
});
