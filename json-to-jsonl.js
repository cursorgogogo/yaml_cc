(function () {
    const EXAMPLE = `[
  {"id": 1, "name": "Alice", "active": true},
  {"id": 2, "name": "Bob", "active": false},
  {"id": 3, "name": "Carol", "tags": ["admin", "user"]}
]`;

    document.addEventListener('DOMContentLoaded', async () => {
        const ts = window.ToolShared;
        const resultDiv = document.getElementById('result-output');
        if (!ts || !resultDiv) return;

        ts.mountToolNav('json-to-jsonl');
        let editor;

        try {
            editor = await ts.initAceEditor('editor-input', 'json');
            editor.setValue(EXAMPLE, -1);
            resultDiv.textContent = 'Ready. Paste a JSON array (or single object) and click Convert to JSONL.';
        } catch (e) {
            console.error(e);
            ts.showError(resultDiv, 'Initialization failed', e.message, 'Refresh the page.');
            return;
        }

        document.getElementById('validate-btn').addEventListener('click', () => {
            const input = editor.getValue().trim();
            if (!input) return ts.showInfo(resultDiv, 'Enter JSON to validate.');
            try {
                const parsed = JSON.parse(input);
                const type = Array.isArray(parsed) ? 'array' : typeof parsed;
                const count = Array.isArray(parsed) ? parsed.length : 1;
                resultDiv.innerHTML = `<pre style="padding:1rem;margin:0">✅ Valid JSON (${type}) — will produce ${count} JSONL line${count !== 1 ? 's' : ''}</pre>`;
            } catch (e) {
                ts.showError(resultDiv, 'Invalid JSON', e.message, 'Check commas and quotes.');
            }
        });

        document.getElementById('convert-btn').addEventListener('click', () => {
            const input = editor.getValue().trim();
            if (!input) return ts.showInfo(resultDiv, 'Enter JSON to convert.');
            try {
                const output = ts.jsonToJsonl(input);
                ts.showConversionSuccess(
                    resultDiv,
                    'Converted to JSONL',
                    output,
                    ts.sizeStats(new Blob([input]).size, new Blob([output]).size, output)
                );
            } catch (e) {
                ts.showError(resultDiv, 'Conversion failed', e.message, 'Use a JSON array or a single object.');
            }
        });

        document.getElementById('clear-btn').addEventListener('click', () => {
            editor.setValue('', -1);
            resultDiv.innerHTML = '';
        });
    });
})();
