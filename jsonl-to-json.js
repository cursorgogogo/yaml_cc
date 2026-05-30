(function () {
    const EXAMPLE = `{"id":1,"name":"Alice","active":true}
{"id":2,"name":"Bob","active":false}
{"id":3,"name":"Carol","tags":["admin","user"]}`;

    document.addEventListener('DOMContentLoaded', async () => {
        const ts = window.ToolShared;
        const resultDiv = document.getElementById('result-output');
        if (!ts || !resultDiv) return;

        ts.mountToolNav('jsonl-to-json');
        let editor;

        function showLintReport(report) {
            const rendered = ts.renderLintReport(report);
            const cls = rendered.ok ? 'compare-status-success' : 'compare-status-error';
            resultDiv.innerHTML = `<pre class="jsonl-lint-report ${cls}" style="white-space:pre-wrap;font-family:monospace;margin:0;padding:1rem;border-radius:0.375rem;">${ts.escapeHtml(rendered.text)}</pre>`;
        }

        try {
            editor = await ts.initAceEditor('editor-input', 'json');
            editor.setValue(EXAMPLE, -1);
            resultDiv.textContent =
                'Lint or format JSONL on the left, or convert to JSON. Multiple lines become a JSON array; one line becomes a single JSON value.';
        } catch (e) {
            console.error(e);
            ts.showError(resultDiv, 'Initialization failed', e.message, 'Refresh the page.');
            return;
        }

        document.getElementById('lint-btn').addEventListener('click', () => {
            const input = editor.getValue().trim();
            if (!input) return ts.showInfo(resultDiv, 'Enter JSONL to lint.');
            showLintReport(ts.lintJsonl(input));
        });

        document.getElementById('format-btn').addEventListener('click', () => {
            const input = editor.getValue().trim();
            if (!input) return ts.showInfo(resultDiv, 'Enter JSONL to format.');
            try {
                const records = ts.parseJsonl(input);
                if (records.length === 0) {
                    return ts.showInfo(resultDiv, 'No non-empty lines found.');
                }
                const output = ts.stringifyJsonl(records, false);
                editor.setValue(output, -1);
                ts.showConversionSuccess(
                    resultDiv,
                    'JSONL formatted (one compact object per line)',
                    output,
                    ts.sizeStats(new Blob([input]).size, new Blob([output]).size, output)
                );
            } catch (e) {
                ts.showError(resultDiv, 'Format failed', e.message, 'Use Lint JSONL to find errors first.');
            }
        });

        document.getElementById('convert-btn').addEventListener('click', () => {
            const input = editor.getValue().trim();
            if (!input) return ts.showInfo(resultDiv, 'Enter JSONL to convert.');
            try {
                const output = ts.jsonlToJson(input);
                const title =
                    input.split(/\r?\n/).filter((l) => l.trim()).length === 1
                        ? 'Converted to JSON (single value)'
                        : 'Converted to JSON (array of records)';
                ts.showConversionSuccess(
                    resultDiv,
                    title,
                    output,
                    ts.sizeStats(new Blob([input]).size, new Blob([output]).size, output)
                );
            } catch (e) {
                ts.showError(resultDiv, 'Conversion failed', e.message, 'Each line must be valid JSON.');
            }
        });

        document.getElementById('clear-btn').addEventListener('click', () => {
            editor.setValue('', -1);
            resultDiv.innerHTML = '';
        });
    });
})();
