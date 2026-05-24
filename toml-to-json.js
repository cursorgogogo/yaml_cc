(function () {
    const EXAMPLE = `title = "App Config"

[server]
host = "localhost"
port = 8080

[[features]]
name = "auth"
enabled = true
`;

    document.addEventListener('DOMContentLoaded', async () => {
        const ts = window.ToolShared;
        const resultDiv = document.getElementById('result-output');
        if (!ts || !resultDiv) return;

        ts.mountToolNav('toml-to-json');
        let editor;
        let parseToml;

        try {
            const toml = await ts.loadSmolToml();
            parseToml = toml.parse;
            editor = await ts.initAceEditor('editor-input', 'toml');
            editor.setValue(EXAMPLE, -1);
            resultDiv.textContent = 'Ready. Paste TOML and click Convert to JSON.';
        } catch (e) {
            console.error(e);
            ts.showError(resultDiv, 'Initialization failed', e.message, 'Check your network or refresh the page.');
            return;
        }

        document.getElementById('validate-btn').addEventListener('click', () => {
            const input = editor.getValue().trim();
            if (!input) return ts.showInfo(resultDiv, 'Enter TOML to validate.');
            try {
                parseToml(input);
                resultDiv.innerHTML = '<pre style="padding:1rem;margin:0">✅ Valid TOML</pre>';
            } catch (e) {
                ts.showError(resultDiv, 'Invalid TOML', e.message, null);
            }
        });

        document.getElementById('format-btn').addEventListener('click', () => {
            const input = editor.getValue().trim();
            if (!input) return ts.showInfo(resultDiv, 'Enter TOML to format.');
            try {
                const output = JSON.stringify(parseToml(input), ts.jsonReplacer, 2);
                ts.showConversionSuccess(resultDiv, 'Parsed TOML as JSON (preview)', output, '');
            } catch (e) {
                ts.showError(resultDiv, 'Cannot format', e.message, null);
            }
        });

        document.getElementById('convert-btn').addEventListener('click', () => {
            const input = editor.getValue().trim();
            if (!input) return ts.showInfo(resultDiv, 'Enter TOML to convert.');
            try {
                const parsed = parseToml(input);
                const output = JSON.stringify(parsed, ts.jsonReplacer, 2);
                ts.showConversionSuccess(
                    resultDiv,
                    'Converted to JSON',
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
