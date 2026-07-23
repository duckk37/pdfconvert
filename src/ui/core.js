const Toast = {
    _container: null,

    _getContainer() {
        if (!this._container) {
            this._container = document.getElementById('toast-container');
        }
        return this._container;
    },

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {'success'|'error'|'warning'|'info'} type - Toast type
     * @param {number} duration - Auto-dismiss in ms (default 4000)
     */
    show(message, type = 'info', duration = 4000) {
        const container = this._getContainer();
        const icons = {
            success: 'fa-circle-check',
            error: 'fa-circle-xmark',
            warning: 'fa-triangle-exclamation',
            info: 'fa-circle-info'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fa-solid ${icons[type]} toast-icon"></i>
            <span>${message}</span>
        `;
        container.appendChild(toast);

        // Auto-dismiss
        setTimeout(() => {
            toast.classList.add('removing');
            toast.addEventListener('animationend', () => toast.remove());
        }, duration);
    },

    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error', 6000); },
    warning(msg) { this.show(msg, 'warning', 5000); },
    info(msg) { this.show(msg, 'info'); }
};

const Progress = {
    _overlay: null,
    _progressEl: null,
    _fillEl: null,
    _statusEl: null,
    _percentEl: null,
    _textEl: null,

    _init() {
        this._overlay = document.getElementById('loading-overlay');
        this._progressEl = document.getElementById('loading-progress');
        this._fillEl = document.getElementById('progress-fill');
        this._statusEl = document.getElementById('progress-status');
        this._percentEl = document.getElementById('progress-percent');
        this._textEl = document.getElementById('loading-text');
    },

    /** Show loading overlay with optional progress tracking */
    show(withProgress = false) {
        if (!this._overlay) this._init();
        this._overlay.classList.remove('hidden');
        this._progressEl.style.display = withProgress ? 'block' : 'none';
        this._textEl.textContent = 'Processing...';
        this.update(0, 'Starting...');
    },

    /** Update the progress bar (0-100) */
    update(percent, statusText) {
        if (!this._fillEl) this._init();
        const clamped = Math.min(100, Math.max(0, Math.round(percent)));
        this._fillEl.style.width = clamped + '%';
        this._percentEl.textContent = clamped + '%';
        if (statusText) this._statusEl.textContent = statusText;
    },

    /** Hide loading overlay and reset progress */
    hide() {
        if (!this._overlay) this._init();
        this._overlay.classList.add('hidden');
        this._progressEl.style.display = 'none';
        this.update(0, '');
    }
};

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Schedule URL revocation after browser has time to initiate download
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function setupDropZone(dropZoneEl, fileInputEl, onFilePicked) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
        dropZoneEl.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); }, false);
    });
    ['dragenter', 'dragover'].forEach(evt => {
        dropZoneEl.addEventListener(evt, () => dropZoneEl.classList.add('dragover'), false);
    });
    ['dragleave', 'drop'].forEach(evt => {
        dropZoneEl.addEventListener(evt, () => dropZoneEl.classList.remove('dragover'), false);
    });
    dropZoneEl.addEventListener('drop', e => {
        const file = e.dataTransfer.files[0];
        if (file) onFilePicked(file);
    }, false);
    dropZoneEl.addEventListener('click', () => fileInputEl.click());
    fileInputEl.addEventListener('change', () => {
        if (fileInputEl.files[0]) {
            onFilePicked(fileInputEl.files[0]);
            fileInputEl.value = '';
        }
    });
}

export { Toast, Progress, downloadBlob, setupDropZone };
export function showLoading() { Progress.show(false); }
export function hideLoading() { Progress.hide(); }
