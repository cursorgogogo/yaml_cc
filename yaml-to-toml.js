(function () {
    const EXAMPLE = `title: App Config

server:
  host: localhost
  port: 8080

features:
  - name: auth
    enabled: true
`;

    document.addEventListener('DOMContentLoaded', async () => {
        const ts = window.ToolShared;
        const resultDiv = document.getElementById('result-output');
        if (!ts || !resultDiv) return;

        ts.mountToolNav('yaml-to-toml');
        let editor;
        let stringifyToml;

        try {
            const toml = await ts.loadSmolToml();
            stringifyToml = toml.stringify;
            await ts.waitForJsYaml();
            editor = await ts.initAceEditor('editor-input', 'yaml');
            editor.setValue(EXAMPLE, -1);
            resultDiv.textContent = 'Ready. Paste YAML and click Convert to TOML.';
        } catch (e) {
            console.error(e);
            ts.showError(resultDiv, 'Initialization failed', e.message, 'Check your network or refresh the page.');
            return;
        }

        document.getElementById('validate-btn').addEventListener('click', () => {
            const input = editor.getValue().trim();
            if (!input) return ts.showInfo(resultDiv, 'Enter YAML to validate.');
            try {
                jsyaml.load(input);
                resultDiv.innerHTML = '<pre style="padding:1rem;margin:0">✅ Valid YAML</pre>';
            } catch (e) {
                ts.showError(resultDiv, 'Invalid YAML', e.message, 'Check indentation and colons.');
            }
        });

        document.getElementById('convert-btn').addEventListener('click', () => {
            const input = editor.getValue().trim();
            if (!input) return ts.showInfo(resultDiv, 'Enter YAML to convert.');
            try {
                const parsed = jsyaml.load(input);
                const output = stringifyToml(ts.prepareForToml(parsed));
                ts.showConversionSuccess(
                    resultDiv,
                    'Converted to TOML',
                    output,
                    ts.sizeStats(new Blob([input]).size, new Blob([output]).size, output)
                );
            } catch (e) {
                ts.showError(resultDiv, 'Conversion failed', e.message, 'Anchors and custom tags may not convert.');
            }
        });

        document.getElementById('clear-btn').addEventListener('click', () => {
            editor.setValue('', -1);
            resultDiv.innerHTML = '';
        });
    });
})();
