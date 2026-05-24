(function () {
    const EXAMPLE = `{
  "title": "App Config",
  "server": {
    "host": "localhost",
    "port": 8080
  },
  "features": [
    { "name": "auth", "enabled": true }
  ]
}`;

    document.addEventListener('DOMContentLoaded', async () => {
        const ts = window.ToolShared;
        const resultDiv = document.getElementById('result-output');
        if (!ts || !resultDiv) return;

        ts.mountToolNav('json-to-toml');
        let editor;
        let stringifyToml;

        try {
            const toml = await ts.loadSmolToml();
            stringifyToml = toml.stringify;
            editor = await ts.initAceEditor('editor-input', 'json');
            editor.setValue(EXAMPLE, -1);
            resultDiv.textContent = 'Ready. Paste JSON and click Convert to TOML.';
        } catch (e) {
            console.error(e);
            ts.showError(resultDiv, 'Initialization failed', e.message, 'Check your network or refresh the page.');
            return;
        }

        document.getElementById('validate-btn').addEventListener('click', () => {
            const input = editor.getValue().trim();
            if (!input) return ts.showInfo(resultDiv, 'Enter JSON to validate.');
            try {
                JSON.parse(input);
                resultDiv.innerHTML = '<pre style="padding:1rem;margin:0">✅ Valid JSON</pre>';
            } catch (e) {
                ts.showError(resultDiv, 'Invalid JSON', e.message, 'Check commas and quotes.');
            }
        });

        document.getElementById('format-btn').addEventListener('click', () => {
            const input = editor.getValue().trim();
            if (!input) return ts.showInfo(resultDiv, 'Enter JSON to format.');
            try {
                const formatted = JSON.stringify(JSON.parse(input), null, 2);
                editor.setValue(formatted, -1);
                ts.showConversionSuccess(resultDiv, 'JSON formatted', formatted, '');
            } catch (e) {
                ts.showError(resultDiv, 'Cannot format JSON', e.message, null);
            }
        });

        document.getElementById('convert-btn').addEventListener('click', () => {
            const input = editor.getValue().trim();
            if (!input) return ts.showInfo(resultDiv, 'Enter JSON to convert.');
            try {
                const parsed = JSON.parse(input);
                const output = stringifyToml(ts.prepareForToml(parsed));
                ts.showConversionSuccess(
                    resultDiv,
                    'Converted to TOML',
                    output,
                    ts.sizeStats(new Blob([input]).size, new Blob([output]).size, output)
                );
            } catch (e) {
                ts.showError(resultDiv, 'Conversion failed', e.message, null);
            }
        });

        document.getElementById('clear-btn').addEventListener('click', () => {
            editor.setValue('', -1);
            resultDiv.innerHTML = '';
        });
    });
})();
