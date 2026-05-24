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

        ts.mountToolNav('toml-to-yaml');
        let editor;
        let parseToml;

        try {
            const toml = await ts.loadSmolToml();
            parseToml = toml.parse;
            await ts.waitForJsYaml();
            editor = await ts.initAceEditor('editor-input', 'toml');
            editor.setValue(EXAMPLE, -1);
            resultDiv.textContent = 'Ready. Paste TOML and click Convert to YAML.';
        } catch (e) {
            console.error(e);
            ts.showError(resultDiv, 'Initialization failed', e.message, 'Check your network or refresh. Use a local server (not file://) if the problem persists.');
            return;
        }

        document.getElementById('validate-btn').addEventListener('click', () => {
            const input = editor.getValue().trim();
            if (!input) return ts.showInfo(resultDiv, 'Enter TOML to validate.');
            try {
                parseToml(input);
                resultDiv.innerHTML = '<pre style="padding:1rem;margin:0">✅ Valid TOML</pre>';
            } catch (e) {
                ts.showError(resultDiv, 'Invalid TOML', e.message, 'Check table headers and key syntax.');
            }
        });

        document.getElementById('convert-btn').addEventListener('click', () => {
            const input = editor.getValue().trim();
            if (!input) return ts.showInfo(resultDiv, 'Enter TOML to convert.');
            try {
                const parsed = parseToml(input);
                const output = jsyaml.dump(parsed, { indent: 2, lineWidth: 80, noRefs: true, sortKeys: false });
                ts.showConversionSuccess(
                    resultDiv,
                    'Converted to YAML',
                    output,
                    ts.sizeStats(new Blob([input]).size, new Blob([output]).size, output)
                );
            } catch (e) {
                ts.showError(resultDiv, 'Conversion failed', e.message, 'Fix TOML syntax first.');
            }
        });

        document.getElementById('clear-btn').addEventListener('click', () => {
            editor.setValue('', -1);
            resultDiv.innerHTML = '';
        });
    });
})();
