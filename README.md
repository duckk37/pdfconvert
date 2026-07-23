# 📄 PDF Tools (100% Client-Side)

A powerful, fast, and secure suite of PDF tools that runs **entirely in your web browser**. No backend servers, no file uploads, zero privacy risks. Built with vanilla HTML, CSS, JavaScript, and cutting-edge WebAssembly AI.

[![Live Demo (Replace with your GitHub Pages URL)](https://img.shields.io/badge/Demo-Live_Website-blue)](https://duckk37.github.io/pdfconvert/)

---

## 🌟 Key Highlights

- **🔒 100% Privacy & Security:** Your files never leave your device. All processing is done locally by your computer/phone's CPU.
- **⚡ Lightning Fast:** No waiting for files to upload or download.
- **📱 Progressive Web App (PWA):** Install it directly to your phone or desktop. It works offline too!
- **🤖 Browser AI:** Built-in OCR (Text Recognition) powered by Tesseract.js using WebAssembly.
- **📸 WebRTC Scanner:** Turn your device's camera into a multi-page document scanner.
- **🎨 Dark Mode First:** Sleek, modern, and eye-friendly UI.

---

## 🛠️ Features (17 Tools)

1. **Merge PDF**: Combine multiple PDFs into one unified document.
2. **Split PDF**: Extract specific pages or split into multiple files.
3. **Remove PDF pages**: Visually select and delete unwanted pages.
4. **Extract PDF pages**: Pick and save specific pages to a new document.
5. **Rotate PDF pages**: Rotate all or specific pages by 90/180/270 degrees.
6. **Protect PDF**: Add a password to encrypt your PDF.
7. **Unlock PDF**: Remove password protection from a PDF (requires the current password).
8. **Watermark**: Overlay custom text watermarks across your document.
9. **Add Page Numbers**: Automatically number your pages.
10. **Rearrange PDF pages**: Change the order of pages by entering a new sequence.
11. **Images to PDF**: Convert JPG/PNG images into a single PDF.
12. **PDF to Images**: Rasterize your PDF pages into high-quality JPG images.
13. **Camera Scanner**: Use your device's camera to scan real-world documents into PDFs.
14. **Sign PDF**: Draw your signature digitally and append it to your document.
15. **PDF OCR**: AI-powered text extraction from scanned documents (Supports English & Vietnamese).
16. **Word to PDF**: Convert `.docx` files to PDF directly in the browser.
17. **Extract PDF Images**: Auto-detect and download all embedded images from a PDF.

---

## 💻 Technologies Used

- **Vanilla HTML/CSS/JS** (Zero build tools required for the core app)
- **[pdf-lib](https://pdf-lib.js.org/)**: Core PDF manipulation and generation.
- **[pdf.js](https://mozilla.github.io/pdf.js/)**: PDF parsing and rendering to Canvas.
- **[Tesseract.js](https://tesseract.projectnaptha.com/)**: Pure Javascript OCR using WebAssembly.
- **[mammoth.js](https://github.com/mwilliamson/mammoth.js/) & [html2pdf.js](https://github.com/eKoopmans/html2pdf.js)**: Word to HTML to PDF conversion pipeline.
- **Service Workers & Web App Manifest**: PWA and Offline Support.
- **WebRTC (`getUserMedia`)**: Camera access for the scanner tool.

---

## 🚀 How to Run Locally

Since this app uses Service Workers and Camera APIs, it requires a local web server (cannot be opened simply via `file://`).

**Using Python (Recommended):**
```bash
# Clone the repository
git clone https://github.com/duckk37/pdfconvert.git
cd pdfconvert

# Run a simple HTTP server
python server.py
# Or use Python's built-in server: python -m http.server 8000
```
Then, open your browser and navigate to `http://localhost:8000`.

**Using Node.js:**
```bash
npx serve .
```

---

## ⚙️ Deployment

This project is perfectly suited for static hosting platforms like **GitHub Pages**, **Vercel**, **Netlify**, or **Cloudflare Pages**. Since there is no backend, simply deploy the directory and it will work out of the box!

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
