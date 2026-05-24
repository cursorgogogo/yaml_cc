class JSONToYAMLTool {
    constructor() {
        this.editor = null;
        this.init();
    }

    init() {
        this.initAceEditor();
        this.bindEvents();
        this.setupExampleData();
    }

    initAceEditor() {
        const editorElement = document.getElementById('json-input');
        if (!editorElement) return;

        const initEditor = () => {
            if (typeof ace !== 'undefined' && ace && ace.edit) {
                try {
                    this.editor = ace.edit('json-input');
                    this.editor.setTheme('ace/theme/monokai');
                    this.editor.session.setMode('ace/mode/json');
                    this.editor.setOptions({
                        fontSize: 14,
                        showPrintMargin: false,
                        showLineNumbers: true,
                        showGutter: true,
                        wrap: true,
                        tabSize: 2,
                        useSoftTabs: true,
                        highlightActiveLine: true
                    });
                } catch (error) {
                    console.warn('Failed to initialize Ace editor:', error);
                }
            } else {
                setTimeout(initEditor, 100);
            }
        };

        initEditor();
    }

    bindEvents() {
        document.getElementById('validate-json-btn').addEventListener('click', () => this.validateJSON());
        document.getElementById('format-json-btn').addEventListener('click', () => this.formatJSON());
        document.getElementById('convert-btn').addEventListener('click', () => this.convertToYAML());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearAll());
    }

    setupExampleData() {
        const exampleJSON = `{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "hobbies": ["reading", "coding", "hiking"],
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "country": "USA"
  }
}`;

        if (this.editor) {
            this.editor.setValue(exampleJSON, -1);
        }
    }

    getJSONInput() {
        if (this.editor) {
            return this.editor.getValue();
        }
        const element = document.getElementById('json-input');
        return element ? (element.value || element.textContent || '') : '';
    }

    parseJSON(input) {
        const trimmed = input.trim();
        if (!trimmed) {
            throw new Error('Empty input');
        }
        return JSON.parse(trimmed);
    }

    validateJSON() {
        const resultDiv = document.getElementById('result-output');
        const input = this.getJSONInput().trim();

        if (!input) {
            this.showInfo(resultDiv, 'Please enter some JSON content to validate.');
            return;
        }

        try {
            const parsed = this.parseJSON(input);
            const type = Array.isArray(parsed) ? 'array' : typeof parsed;
            const keys = type === 'object' && parsed !== null ? Object.keys(parsed).length : 0;

            const html = `
                <div class="result-success">
                    <div class="result-header">
                        <span class="result-icon">✅</span>
                        <h3>Valid JSON</h3>
                    </div>
                    <div class="result-stats">
                        <div class="stat-item">
                            <span class="stat-label">Root type:</span>
                            <span class="stat-value">${type}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Top-level keys:</span>
                            <span class="stat-value">${keys}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Input size:</span>
                            <span class="stat-value">${new Blob([input]).size} bytes</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Lines:</span>
                            <span class="stat-value">${input.split('\n').length}</span>
                        </div>
                    </div>
                </div>
            `;
            resultDiv.innerHTML = html;
        } catch (error) {
            this.showJSONError(resultDiv, error, 'Cannot validate invalid JSON');
        }
    }

    formatJSON() {
        const resultDiv = document.getElementById('result-output');
        const input = this.getJSONInput().trim();

        if (!input) {
            this.showInfo(resultDiv, 'Please enter some JSON content to format.');
            return;
        }

        try {
            const parsed = this.parseJSON(input);
            const formatted = JSON.stringify(parsed, null, 2);

            if (this.editor) {
                this.editor.setValue(formatted, -1);
            }

            const html = `
                <div class="result-success">
                    <div class="result-header">
                        <span class="result-icon">⚡</span>
                        <h3>JSON Formatted Successfully</h3>
                    </div>
                    <div class="formatted-code">
                        <pre><code>${this.escapeHtml(formatted)}</code></pre>
                    </div>
                </div>
            `;
            resultDiv.innerHTML = html;
            this.addCopyButtonToResult(resultDiv, formatted);
        } catch (error) {
            this.showJSONError(resultDiv, error, 'Cannot format invalid JSON');
        }
    }

    convertToYAML() {
        const resultDiv = document.getElementById('result-output');
        const input = this.getJSONInput().trim();

        if (!input) {
            this.showInfo(resultDiv, 'Please enter some JSON content to convert to YAML.');
            return;
        }

        if (typeof jsyaml === 'undefined') {
            this.showInfo(resultDiv, 'YAML library is still loading. Please try again in a moment.');
            return;
        }

        try {
            const parsed = this.parseJSON(input);
            const yamlString = jsyaml.dump(parsed, {
                indent: 2,
                lineWidth: 80,
                noRefs: true,
                sortKeys: false,
                forceQuotes: false,
                condenseFlow: false
            });

            const jsonSize = new Blob([input]).size;
            const yamlSize = new Blob([yamlString]).size;
            const sizeDiff = jsonSize > 0 ? ((yamlSize / jsonSize - 1) * 100).toFixed(1) : '0';

            const html = `
                <div class="result-success">
                    <div class="result-header">
                        <span class="result-icon">🔄</span>
                        <h3>Converted to YAML Successfully</h3>
                    </div>
                    <div class="result-stats">
                        <div class="stat-item">
                            <span class="stat-label">JSON Size:</span>
                            <span class="stat-value">${jsonSize} bytes</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">YAML Size:</span>
                            <span class="stat-value">${yamlSize} bytes</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Size change:</span>
                            <span class="stat-value">${sizeDiff > 0 ? '+' : ''}${sizeDiff}%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">YAML lines:</span>
                            <span class="stat-value">${yamlString.split('\n').length}</span>
                        </div>
                    </div>
                    <div class="formatted-code">
                        <pre><code>${this.escapeHtml(yamlString)}</code></pre>
                    </div>
                </div>
            `;
            resultDiv.innerHTML = html;
            this.addCopyButtonToResult(resultDiv, yamlString);
        } catch (error) {
            if (error instanceof SyntaxError || error.message.includes('JSON')) {
                this.showJSONError(resultDiv, error, 'Cannot convert invalid JSON');
            } else {
                this.showJSONError(resultDiv, error, 'Conversion failed');
            }
        }
    }

    clearAll() {
        if (this.editor) {
            this.editor.setValue('');
        }
        const resultDiv = document.getElementById('result-output');
        resultDiv.innerHTML = '';
    }

    showInfo(resultDiv, message) {
        resultDiv.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace; margin: 0; padding: 1rem;">${this.escapeHtml('💡 ' + message)}</pre>`;
    }

    showJSONError(resultDiv, error, title) {
        let detail = error.message;
        if (error instanceof SyntaxError && error.message.includes('position')) {
            detail = error.message;
        }

        const html = `
            <div class="result-error">
                <div class="result-header">
                    <span class="result-icon">❌</span>
                    <h3>${this.escapeHtml(title)}</h3>
                </div>
                <div class="error-message">
                    <strong>Error:</strong> ${this.escapeHtml(detail)}
                </div>
                <div class="error-suggestion">
                    💡 <strong>Suggestion:</strong> Check for missing commas, unquoted keys, trailing commas, or mismatched brackets.
                </div>
            </div>
        `;
        resultDiv.innerHTML = html;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    addCopyButtonToResult(resultDiv, textToCopy) {
        const existingCopyBtn = resultDiv.querySelector('.copy-btn');
        if (existingCopyBtn) {
            existingCopyBtn.remove();
        }

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span>';
        copyBtn.title = 'Copy to clipboard';
        copyBtn.style.cssText = `
            position: absolute;
            top: 6px;
            right: 6px;
            padding: 4px 8px;
            background: rgba(59, 130, 246, 0.9);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.75rem;
            font-weight: 500;
            z-index: 10;
            display: flex;
            align-items: center;
            gap: 4px;
        `;

        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(textToCopy);
                copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>';
                copyBtn.style.background = '#10b981';
                setTimeout(() => {
                    copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span>';
                    copyBtn.style.background = 'rgba(59, 130, 246, 0.9)';
                }, 2000);
            } catch (err) {
                console.error('Copy failed:', err);
            }
        });

        resultDiv.style.position = 'relative';
        resultDiv.appendChild(copyBtn);
    }
}

function waitForJsYaml(timeout = 10000) {
    return new Promise((resolve, reject) => {
        if (typeof jsyaml !== 'undefined') {
            resolve();
            return;
        }
        const start = Date.now();
        const check = () => {
            if (typeof jsyaml !== 'undefined') {
                resolve();
            } else if (Date.now() - start > timeout) {
                reject(new Error('js-yaml failed to load'));
            } else {
                setTimeout(check, 50);
            }
        };
        check();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        await waitForJsYaml();
        window.jsonToYamlTool = new JSONToYAMLTool();

        const resultDiv = document.getElementById('result-output');
        if (resultDiv) {
            resultDiv.innerHTML = '✅ JSON to YAML ready! Paste JSON on the left and click "Convert to YAML".';
        }
    } catch (error) {
        console.error('Failed to initialize JSON to YAML tool:', error);
        const resultDiv = document.getElementById('result-output');
        if (resultDiv) {
            resultDiv.innerHTML = `❌ Failed to load conversion library. Please refresh the page.`;
        }
    }
});
