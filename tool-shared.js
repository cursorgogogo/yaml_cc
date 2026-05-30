const TOOL_PAGES = [
    { href: '/', label: 'YAML → JSON', id: 'yaml-tools' },
    { href: 'json-to-yaml.html', label: 'JSON → YAML', id: 'json-to-yaml' },
    { href: 'toml-to-yaml.html', label: 'TOML → YAML', id: 'toml-to-yaml' },
    { href: 'yaml-to-toml.html', label: 'YAML → TOML', id: 'yaml-to-toml' },
    { href: 'json-to-toml.html', label: 'JSON → TOML', id: 'json-to-toml' },
    { href: 'toml-to-json.html', label: 'TOML → JSON', id: 'toml-to-json' },
    { href: 'json-to-jsonl.html', label: 'JSON → JSONL', id: 'json-to-jsonl' },
    { href: 'jsonl-to-json.html', label: 'JSONL → JSON', id: 'jsonl-to-json' }
];

function parseJsonl(text) {
    const lines = text.split(/\r?\n/);
    const records = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        try {
            records.push({ lineNum: i + 1, value: JSON.parse(line) });
        } catch (e) {
            throw new Error(`Line ${i + 1}: ${e.message}`);
        }
    }
    return records;
}

function stringifyJsonl(records, pretty) {
    return records
        .map((r) => (pretty ? JSON.stringify(r.value, null, 2) : JSON.stringify(r.value)))
        .join('\n');
}

function jsonToJsonl(text) {
    const parsed = JSON.parse(text.trim());
    if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
            throw new Error('JSON array is empty. Add at least one object to convert.');
        }
        return parsed.map((item) => JSON.stringify(item)).join('\n');
    }
    return JSON.stringify(parsed);
}

function lintJsonl(text) {
    const lines = text.split(/\r?\n/);
    const errors = [];
    const warnings = [];
    let recordCount = 0;
    let blankLines = 0;

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const trimmed = raw.trim();
        if (!trimmed) {
            blankLines++;
            continue;
        }
        if (raw !== trimmed) {
            warnings.push({
                line: i + 1,
                message: 'Line has leading or trailing whitespace (may break strict JSONL parsers).'
            });
        }
        try {
            const value = JSON.parse(trimmed);
            if (value === null || typeof value !== 'object') {
                warnings.push({
                    line: i + 1,
                    message: `Line is valid JSON but root is ${value === null ? 'null' : typeof value} (usually an object).`
                });
            }
            recordCount++;
        } catch (e) {
            errors.push({ line: i + 1, message: e.message });
        }
    }

    if (recordCount === 0 && errors.length === 0) {
        errors.push({ line: null, message: 'No non-empty lines with JSON content found.' });
    }

    return {
        valid: errors.length === 0,
        recordCount,
        blankLines,
        totalLines: lines.length,
        errors,
        warnings
    };
}

function renderLintReport(report) {
    if (report.valid) {
        let html = '✅ JSONL lint passed\n\n';
        html += `Records: ${report.recordCount}\n`;
        html += `Total lines: ${report.totalLines}\n`;
        if (report.blankLines > 0) {
            html += `Blank lines: ${report.blankLines} (ignored)\n`;
        }
        if (report.warnings.length > 0) {
            html += `\nWarnings (${report.warnings.length}):\n`;
            report.warnings.forEach((w, i) => {
                html += `${i + 1}. Line ${w.line}: ${w.message}\n`;
            });
        } else {
            html += '\nNo issues found.';
        }
        return { ok: true, text: html };
    }

    let html = `❌ JSONL lint failed — ${report.errors.length} error${report.errors.length !== 1 ? 's' : ''}\n\n`;
    report.errors.forEach((err, i) => {
        html += `${i + 1}. ${err.line != null ? `Line ${err.line}: ` : ''}${err.message}\n`;
    });
    if (report.warnings.length > 0) {
        html += `\nWarnings:\n`;
        report.warnings.forEach((w, i) => {
            html += `${i + 1}. Line ${w.line}: ${w.message}\n`;
        });
    }
    return { ok: false, text: html };
}

function mountToolNav(activeId) {
    const nav = document.querySelector('.tool-nav');
    if (!nav) return;
    nav.innerHTML = TOOL_PAGES.map((page) => {
        const active = page.id === activeId ? ' tool-nav-item-active' : '';
        return `<a href="${page.href}" class="tool-nav-item${active}">${page.label}</a>`;
    }).join('');
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

function showInfo(resultDiv, message) {
    resultDiv.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace; margin: 0; padding: 1rem;">${escapeHtml('💡 ' + message)}</pre>`;
}

function showError(resultDiv, title, detail, suggestion) {
    const html = `
        <div class="result-error">
            <div class="result-header">
                <span class="result-icon">❌</span>
                <h3>${escapeHtml(title)}</h3>
            </div>
            <div class="error-message">
                <strong>Error:</strong> ${escapeHtml(detail)}
            </div>
            ${suggestion ? `<div class="error-suggestion">💡 <strong>Suggestion:</strong> ${escapeHtml(suggestion)}</div>` : ''}
        </div>
    `;
    resultDiv.innerHTML = html;
}

function showConversionSuccess(resultDiv, title, output, statsHtml) {
    const html = `
        <div class="result-success">
            <div class="result-header">
                <span class="result-icon">🔄</span>
                <h3>${escapeHtml(title)}</h3>
            </div>
            ${statsHtml || ''}
            <div class="formatted-code">
                <pre><code>${escapeHtml(output)}</code></pre>
            </div>
        </div>
    `;
    resultDiv.innerHTML = html;
    addCopyButtonToResult(resultDiv, output);
}

function sizeStats(inputBytes, outputBytes, outputText) {
    const diff = inputBytes > 0 ? ((outputBytes / inputBytes - 1) * 100).toFixed(1) : '0';
    const lines = outputText ? outputText.split('\n').length : 0;
    return `
        <div class="result-stats">
            <div class="stat-item">
                <span class="stat-label">Input size:</span>
                <span class="stat-value">${inputBytes} bytes</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Output size:</span>
                <span class="stat-value">${outputBytes} bytes</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Size change:</span>
                <span class="stat-value">${diff > 0 ? '+' : ''}${diff}%</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Output lines:</span>
                <span class="stat-value">${lines}</span>
            </div>
        </div>
    `;
}

function addCopyButtonToResult(resultDiv, textToCopy) {
    const existing = resultDiv.querySelector('.copy-btn');
    if (existing) existing.remove();

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span>';
    copyBtn.title = 'Copy to clipboard';
    copyBtn.style.cssText = 'position:absolute;top:6px;right:6px;padding:4px 8px;background:rgba(59,130,246,0.9);color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.75rem;font-weight:500;z-index:10;display:flex;align-items:center;gap:4px;';

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

function initAceEditor(elementId, mode) {
    return new Promise((resolve, reject) => {
        const tryInit = () => {
            if (typeof ace === 'undefined' || !ace.edit) {
                setTimeout(tryInit, 100);
                return;
            }
            const el = document.getElementById(elementId);
            if (!el) {
                reject(new Error(`Editor element #${elementId} not found`));
                return;
            }
            try {
                const editor = ace.edit(elementId);
                editor.setTheme('ace/theme/monokai');
                const modeId = `ace/mode/${mode}`;
                try {
                    editor.session.setMode(modeId);
                } catch (modeErr) {
                    console.warn('Ace mode fallback:', modeId, modeErr);
                    editor.session.setMode('ace/mode/plain_text');
                }
                editor.setOptions({
                    fontSize: 14,
                    showPrintMargin: false,
                    showLineNumbers: true,
                    showGutter: true,
                    wrap: true,
                    tabSize: 2,
                    useSoftTabs: true,
                    highlightActiveLine: true
                });
                requestAnimationFrame(() => {
                    editor.resize();
                    resolve(editor);
                });
            } catch (err) {
                reject(err);
            }
        };
        tryInit();
    });
}

let smolTomlPromise = null;

async function loadSmolToml() {
    if (window.__smolToml) {
        return window.__smolToml;
    }
    if (smolTomlPromise) {
        return smolTomlPromise;
    }

    const cdnUrls = [
        'https://esm.sh/smol-toml@1.3.1',
        'https://cdn.jsdelivr.net/npm/smol-toml@1.3.1/+esm',
        'https://unpkg.com/smol-toml@1.3.1?module'
    ];

    smolTomlPromise = (async () => {
        let lastError;
        for (const url of cdnUrls) {
            try {
                const mod = await import(/* webpackIgnore: true */ url);
                const lib = mod.default && mod.default.parse ? mod.default : mod;
                if (typeof lib.parse !== 'function' || typeof lib.stringify !== 'function') {
                    throw new Error('TOML library missing parse/stringify');
                }
                window.__smolToml = lib;
                return lib;
            } catch (err) {
                lastError = err;
                console.warn('TOML CDN failed:', url, err);
            }
        }
        throw lastError || new Error('Failed to load TOML library from CDN');
    })();

    return smolTomlPromise;
}

function waitForJsYaml(timeout = 10000) {
    return new Promise((resolve, reject) => {
        if (typeof jsyaml !== 'undefined') {
            resolve();
            return;
        }
        const start = Date.now();
        const tick = () => {
            if (typeof jsyaml !== 'undefined') resolve();
            else if (Date.now() - start > timeout) reject(new Error('js-yaml failed to load'));
            else setTimeout(tick, 50);
        };
        tick();
    });
}

function prepareForToml(value) {
    if (value === undefined) return null;
    if (value instanceof Date) return value;
    if (Array.isArray(value)) return value.map((item) => prepareForToml(item));
    if (value !== null && typeof value === 'object') {
        const out = {};
        for (const [key, val] of Object.entries(value)) {
            if (val !== undefined) out[key] = prepareForToml(val);
        }
        return out;
    }
    return value;
}

function jsonReplacer(_key, value) {
    if (value instanceof Date) return value.toISOString();
    if (value && typeof value === 'object' && typeof value.toISOString === 'function') {
        return value.toISOString();
    }
    return value;
}

function jsonlToJson(text) {
    const records = parseJsonl(text);
    if (records.length === 0) {
        throw new Error('No JSONL records found. Each non-empty line must be valid JSON.');
    }
    const values = records.map((r) => r.value);
    const output = values.length === 1 ? values[0] : values;
    return JSON.stringify(output, jsonReplacer, 2);
}

window.ToolShared = {
    TOOL_PAGES,
    mountToolNav,
    escapeHtml,
    showInfo,
    showError,
    showConversionSuccess,
    sizeStats,
    addCopyButtonToResult,
    initAceEditor,
    waitForJsYaml,
    loadSmolToml,
    prepareForToml,
    jsonReplacer,
    parseJsonl,
    stringifyJsonl,
    jsonToJsonl,
    jsonlToJson,
    lintJsonl,
    renderLintReport
};
