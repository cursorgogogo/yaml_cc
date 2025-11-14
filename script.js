// YAML Tools - Unified Interface JavaScript
class YAMLTools {
    constructor() {
        this.editor = null;
        this.init();
    }

    init() {
        this.initAceEditor();
        this.bindEvents();
        this.setupExampleData();
        this.setupNavigation();
        this.setupExampleTabs();
    }

    initAceEditor() {
        const editorElement = document.getElementById('yaml-input');
        if (!editorElement) return;
        
        // Wait for Ace to be available
        const initEditor = () => {
            if (typeof ace !== 'undefined' && ace && ace.edit) {
                try {
                    this.editor = ace.edit('yaml-input');
                    this.editor.setTheme('ace/theme/monokai');
                    this.editor.session.setMode('ace/mode/yaml');
                    this.editor.setOptions({
                        fontSize: 14,
                        showPrintMargin: false,
                        showLineNumbers: true,
                        showGutter: true,
                        wrap: true,
                        tabSize: 2,
                        useSoftTabs: true,
                        highlightActiveLine: true,
                        enableBasicAutocompletion: true,
                        enableLiveAutocompletion: false
                    });
                    console.log('Ace editor initialized successfully');
                } catch (error) {
                    console.warn('Failed to initialize Ace editor:', error);
                }
            } else {
                // Retry after a short delay
                setTimeout(initEditor, 100);
            }
        };
        
        initEditor();
    }

    bindEvents() {
        // Unified tool events
        document.getElementById('validate-btn').addEventListener('click', () => this.validateYAML());
        document.getElementById('format-btn').addEventListener('click', () => this.formatYAML());
        document.getElementById('convert-btn').addEventListener('click', () => this.convertYAML());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearAll());

        // Add copy functionality to result boxes
        this.addCopyButtons();
    }

    setupExampleData() {
        const exampleYAML = `# Enter your YAML content here...

# Example:
name: John Doe
age: 30
email: john@example.com
hobbies:
  - reading
  - coding
  - hiking
address:
  street: 123 Main St
  city: New York
  country: USA`;

        // Set example data in editor
        if (this.editor) {
            this.editor.setValue(exampleYAML, -1);
        }
    }

    getYAMLInput() {
        if (this.editor) {
            return this.editor.getValue();
        }
        // Fallback to textarea if editor not available
        const element = document.getElementById('yaml-input');
        return element ? (element.value || element.textContent || '') : '';
    }

    setupNavigation() {
        // Setup logo link to scroll to top
        const logoLink = document.querySelector('.logo-link');
        if (logoLink) {
            logoLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }

        // Setup tool links in footer
        const toolLinks = document.querySelectorAll('a[data-tool]');
        toolLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Scroll to tools section
                const toolsSection = document.querySelector('#tools');
                if (toolsSection) {
                    toolsSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Wait for scroll to complete, then trigger the corresponding tool
                    setTimeout(() => {
                        const toolType = link.getAttribute('data-tool');
                        this.triggerTool(toolType);
                    }, 1000);
                }
            });
        });

        // Get all navigation links
        const navLinks = document.querySelectorAll('.nav-menu a');
        
        // Set initial active state (first link)
        if (navLinks.length > 0) {
            navLinks[0].classList.add('active');
        }
        
        // Add click event listeners
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // e.preventDefault();
                
                // Remove active class from all links
                navLinks.forEach(navLink => navLink.classList.remove('active'));
                
                // Add active class to clicked link
                link.classList.add('active');
                
                // Smooth scroll to target section
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Handle scroll-based active state
        this.handleScrollActiveState();
    }

    handleScrollActiveState() {
        const navLinks = document.querySelectorAll('.nav-menu a');
        const sections = document.querySelectorAll('section[id]');
        
        window.addEventListener('scroll', () => {
            let current = '';
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 200;
                const sectionHeight = section.offsetHeight;
                
                if (window.pageYOffset >= sectionTop && 
                    window.pageYOffset < sectionTop + sectionHeight) {
                    current = section.getAttribute('id');
                }
            });
            
            // Update active nav link based on scroll position
            if (current) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${current}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    validateYAML() {
        const input = this.getYAMLInput().trim();
        const resultDiv = document.getElementById('result-output');
        
        if (!input) {
            this.showResult(resultDiv, '💡 Please enter some YAML content to validate.', 'info');
            return;
        }

        // Perform comprehensive YAML validation
        const validationResult = this.comprehensiveYAMLValidation(input);
        
        if (validationResult.isValid) {
            this.showValidationSuccess(resultDiv, validationResult);
        } else {
            this.showValidationErrors(resultDiv, validationResult);
        }
    }

    comprehensiveYAMLValidation(yamlContent) {
        const errors = [];
        const warnings = [];
        const lines = yamlContent.split('\n');
        let parsed = null;
        let hasSyntaxError = false;
        
        // 1. Line-by-line analysis FIRST (to catch tabs and other issues before parsing)
        let prevIndent = 0;
        let indentSize = null;
        const indentLevels = new Map(); // Track indentation at each level
        
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmedLine = line.trim();
            
            // Skip empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                return;
            }

            const leadingSpaces = line.length - line.trimStart().length;
            
            // Check for tabs (YAML spec requires spaces) - CRITICAL ERROR
            if (line.includes('\t')) {
                errors.push({
                    type: 'indentation',
                    message: 'YAML strictly requires spaces for indentation, not tabs. This is a critical syntax error.',
                    line: lineNum,
                    column: line.indexOf('\t') + 1,
                    severity: 'error',
                    suggestion: 'Replace all tab characters with spaces (use 2 or 4 spaces per indentation level)'
                });
            }

            // Detect indentation size from first indented line
            if (indentSize === null && leadingSpaces > 0 && !trimmedLine.startsWith('-')) {
                indentSize = leadingSpaces;
            }
            
            // Check for inconsistent indentation
            if (indentSize && leadingSpaces > 0) {
                const isListItem = trimmedLine.startsWith('-');
                
                if (!isListItem && leadingSpaces % indentSize !== 0) {
                    errors.push({
                        type: 'indentation',
                        message: `Inconsistent indentation detected. Expected multiples of ${indentSize} spaces, but found ${leadingSpaces} spaces.`,
                        line: lineNum,
                        column: 1,
                        severity: 'error',
                        suggestion: `Adjust indentation to use consistent ${indentSize}-space increments (current: ${leadingSpaces} spaces, should be: ${Math.round(leadingSpaces / indentSize) * indentSize} spaces)`
                    });
                }
            }

            // Check for trailing whitespace
            if (line !== line.trimEnd()) {
                warnings.push({
                    type: 'whitespace',
                    message: 'Line has trailing whitespace which can cause unexpected behavior.',
                    line: lineNum,
                    column: line.trimEnd().length + 1,
                    severity: 'warning',
                    suggestion: 'Remove all trailing whitespace from this line'
                });
            }

            // Check for missing colon in key-value pairs
            if (!trimmedLine.startsWith('-') && !trimmedLine.startsWith('#') && 
                !trimmedLine.includes(':') && trimmedLine.length > 0 &&
                !trimmedLine.match(/^[|>]/) && !trimmedLine.match(/^['"]/) &&
                prevIndent === 0) {
                errors.push({
                    type: 'syntax',
                    message: `Missing colon (:) for key-value pair. Line "${trimmedLine}" appears to be a key without a value.`,
                    line: lineNum,
                    column: 1,
                    severity: 'error',
                    suggestion: `Add a colon after the key: "${trimmedLine}:"`
                });
            }

            // Check for unclosed quotes
            const singleQuotes = (line.match(/'/g) || []).length;
            const doubleQuotes = (line.match(/"/g) || []).length;
            
            if (singleQuotes % 2 !== 0) {
                errors.push({
                    type: 'syntax',
                    message: 'Unclosed single quote detected.',
                    line: lineNum,
                    column: line.indexOf("'") + 1,
                    severity: 'error',
                    suggestion: 'Make sure all single quotes are properly closed'
                });
            }
            
            if (doubleQuotes % 2 !== 0 && !line.includes('\\"')) {
                errors.push({
                    type: 'syntax',
                    message: 'Unclosed double quote detected.',
                    line: lineNum,
                    column: line.indexOf('"') + 1,
                    severity: 'error',
                    suggestion: 'Make sure all double quotes are properly closed'
                });
            }

            // Check for list items with key-value pairs (ambiguous structure)
            if (trimmedLine.startsWith('- ') && trimmedLine.includes(':')) {
                const afterDash = trimmedLine.substring(2).trim();
                const colonPos = afterDash.indexOf(':');
                if (colonPos > 0 && afterDash[colonPos - 1] !== '\\') {
                    // This could be valid (list of objects) or invalid (mixed format)
                    // Check if it's a proper object or just malformed
                    const beforeColon = afterDash.substring(0, colonPos).trim();
                    const afterColon = afterDash.substring(colonPos + 1).trim();
                    
                    if (beforeColon && !afterColon) {
                        warnings.push({
                            type: 'structure',
                            message: `List item contains key "${beforeColon}" without a value. This might be unintentional.`,
                            line: lineNum,
                            column: trimmedLine.indexOf(beforeColon) + 1,
                            severity: 'warning',
                            suggestion: 'If this is a list of objects, ensure proper formatting with values'
                        });
                    }
                }
            }

            // Check for key-value pairs and potential issues
            if (trimmedLine.includes(':') && !trimmedLine.startsWith('-') && !trimmedLine.startsWith('#')) {
                const colonIndex = trimmedLine.indexOf(':');
                const key = trimmedLine.substring(0, colonIndex).trim();
                const value = trimmedLine.substring(colonIndex + 1).trim();
                
                // Check for keys without quotes that contain special characters
                if (key.includes(' ') || key.match(/[{}[\],&*#?|<>=!%@`]/)) {
                    errors.push({
                        type: 'key_format',
                        message: `Key "${key}" contains special characters and should be quoted.`,
                        line: lineNum,
                        column: 1,
                        severity: 'error',
                        suggestion: `Use quoted key: "${key}"`
                    });
                }
                
                // Check for unquoted strings that look like booleans
                if (value && !value.startsWith('"') && !value.startsWith("'") && 
                    !value.startsWith('[') && !value.startsWith('{') &&
                    !value.startsWith('|') && !value.startsWith('>')) {
                    
                    // Warn about yes/no/on/off which are treated as booleans in YAML
                    if (['yes', 'no', 'on', 'off', 'y', 'n'].includes(value.toLowerCase())) {
                        warnings.push({
                            type: 'boolean_interpretation',
                            message: `Value "${value}" will be automatically interpreted as boolean (true/false). Quote it if you want a string.`,
                            line: lineNum,
                            column: colonIndex + 2,
                            severity: 'warning',
                            suggestion: `Use "${value}" to keep it as a string literal`
                        });
                    }
                    
                    // Warn about version-like numbers
                    if (value.match(/^\d+\.\d+/)) {
                        warnings.push({
                            type: 'version_quoting',
                            message: `Value "${value}" looks like a version string. It should be quoted to preserve formatting.`,
                            line: lineNum,
                            column: colonIndex + 2,
                            severity: 'warning',
                            suggestion: `Use "${value}" to ensure it's treated as a string`
                        });
                    }
                    
                    // Warn about date-like values
                    if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
                        warnings.push({
                            type: 'date_format',
                            message: `Value "${value}" looks like a date. It will be converted to a Date object. Quote it if you want a string.`,
                            line: lineNum,
                            column: colonIndex + 2,
                            severity: 'warning',
                            suggestion: `Use "${value}" to keep it as a string`
                        });
                    }
                }
            }

            prevIndent = leadingSpaces;
        });

        // 2. Try to parse with js-yaml to catch additional syntax errors
        try {
            parsed = jsyaml.load(yamlContent);
        } catch (error) {
            hasSyntaxError = true;
            const errorLine = error.mark ? error.mark.line + 1 : null;
            const errorColumn = error.mark ? error.mark.column + 1 : null;
            
            // Create a detailed error message
            let detailedMessage = error.message;
            
            // Add context about what went wrong
            if (error.message.includes('tab character')) {
                detailedMessage = 'YAML does not allow tab characters for indentation. Use spaces instead.';
            } else if (error.message.includes('expected') && error.message.includes('but found')) {
                detailedMessage = `Syntax error: ${error.message}`;
            } else if (error.message.includes('bad indentation')) {
                detailedMessage = `Indentation error: ${error.message}. Make sure all indentation is consistent and uses spaces.`;
            }
            
            errors.push({
                type: 'syntax',
                message: detailedMessage,
                line: errorLine,
                column: errorColumn,
                severity: 'error',
                suggestion: 'Check the line and column indicated for syntax issues. Common problems: unclosed quotes, incorrect indentation, missing colons, or tab characters.'
            });
        }

        // 3. Validate against YAML best practices (only if no critical errors)
        if (parsed && !hasSyntaxError) {
            this.validateBestPractices(yamlContent, parsed, warnings);
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            parsed: parsed,
            statistics: {
                totalLines: lines.length,
                nonEmptyLines: lines.filter(line => line.trim() && !line.trim().startsWith('#')).length,
                commentLines: lines.filter(line => line.trim().startsWith('#')).length,
                errorCount: errors.length,
                warningCount: warnings.length
            }
        };
    }

    validateBestPractices(yamlContent, parsed, warnings) {
        // Check for very deep nesting
        const maxDepth = this.getMaxDepth(parsed);
        if (maxDepth > 10) {
            warnings.push({
                type: 'complexity',
                message: `YAML structure is deeply nested (${maxDepth} levels). Consider simplifying.`,
                line: null,
                column: null,
                severity: 'warning',
                suggestion: 'Break down complex structures into smaller, more manageable pieces'
            });
        }

        // Check for very long lines
        const lines = yamlContent.split('\n');
        lines.forEach((line, index) => {
            if (line.length > 120) {
                warnings.push({
                    type: 'line_length',
                    message: `Line is too long (${line.length} characters). Consider breaking it up.`,
                    line: index + 1,
                    column: 121,
                    severity: 'warning',
                    suggestion: 'Use multiline strings (| or >) for long text content'
                });
            }
        });
    }

    getMaxDepth(obj, currentDepth = 0) {
        if (typeof obj !== 'object' || obj === null) {
            return currentDepth;
        }
        
        if (Array.isArray(obj)) {
            return Math.max(currentDepth, ...obj.map(item => this.getMaxDepth(item, currentDepth + 1)));
        }
        
        const depths = Object.values(obj).map(value => this.getMaxDepth(value, currentDepth + 1));
        return depths.length > 0 ? Math.max(...depths) : currentDepth;
    }


    showValidationSuccess(resultDiv, result) {
        let html = '✅ YAML Validation Successful\n\n';
        
        if (result.warnings.length > 0) {
            html += 'Warnings:\n';
            result.warnings.forEach((warning, index) => {
                html += `${index + 1}. ${warning.line ? `Line ${warning.line}: ` : ''}${warning.message}`;
                if (warning.suggestion) {
                    html += ` (Suggestion: ${warning.suggestion})`;
                }
                html += '\n';
            });
        } else {
            html += 'No issues found.';
        }
        
        resultDiv.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace; margin: 0; padding: 1rem;">${this.escapeHtml(html)}</pre>`;
    }

    showValidationErrors(resultDiv, result) {
        let html = `❌ YAML Validation Failed\n`;
        html += `Found ${result.errors.length} error${result.errors.length !== 1 ? 's' : ''}`;
        if (result.warnings.length > 0) {
            html += ` and ${result.warnings.length} warning${result.warnings.length !== 1 ? 's' : ''}`;
        }
        html += '\n\n';
        
        if (result.errors.length > 0) {
            html += 'Errors:\n';
            result.errors.forEach((error, index) => {
                html += `${index + 1}. Line ${error.line || '?'}${error.column ? `, Column ${error.column}` : ''}: ${error.message}`;
                if (error.suggestion) {
                    html += ` (Fix: ${error.suggestion})`;
                }
                html += '\n';
            });
            html += '\n';
        }
        
        if (result.warnings.length > 0) {
            html += 'Warnings:\n';
            result.warnings.forEach((warning, index) => {
                html += `${index + 1}. ${warning.line ? `Line ${warning.line}${warning.column ? `, Column ${warning.column}` : ''}: ` : ''}${warning.message}`;
                if (warning.suggestion) {
                    html += ` (Suggestion: ${warning.suggestion})`;
                }
                html += '\n';
            });
        }
        
        resultDiv.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace; margin: 0; padding: 1rem;">${this.escapeHtml(html)}</pre>`;
    }

    formatErrorType(type) {
        const typeMap = {
            'indentation': 'Indentation',
            'syntax': 'Syntax Error',
            'key_format': 'Key Format',
            'structure': 'Structure',
            'whitespace': 'Whitespace',
            'boolean_interpretation': 'Type Ambiguity',
            'version_quoting': 'Version String',
            'date_format': 'Date Format',
            'complexity': 'Complexity',
            'line_length': 'Line Length'
        };
        return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    formatYAML() {
        const input = this.getYAMLInput().trim();
        const resultDiv = document.getElementById('result-output');
        
        if (!input) {
            this.showResult(resultDiv, '💡 Please enter some YAML content to format.', 'info');
            return;
        }

        try {
            // Parse YAML first
            const parsed = jsyaml.load(input);
            
            // Format with enhanced options
            const formatted = jsyaml.dump(parsed, {
                indent: 2,                    // Use 2-space indentation
                lineWidth: 80,                // Wrap lines at 80 characters
                noRefs: true,                 // Don't use YAML references
                sortKeys: false,              // Preserve key order
                quotingType: '"',             // Use double quotes
                forceQuotes: false,           // Only quote when necessary
                noCompatMode: false,          // YAML 1.2 compatibility
                condenseFlow: false,          // Don't condense flow collections
                skipInvalid: false            // Don't skip invalid types
            });
            
            // Show formatted result with statistics
            const stats = this.getYAMLStats(parsed);
            const html = `
                <div class="result-success">
                    <div class="result-header">
                        <span class="result-icon">⚡</span>
                        <h3>YAML Formatted Successfully</h3>
                    </div>
                    <div class="result-stats">
                        <div class="stat-item">
                            <span class="stat-label">Top-level Keys:</span>
                            <span class="stat-value">${stats.topLevelKeys}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Total Properties:</span>
                            <span class="stat-value">${stats.totalProperties}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Nesting Depth:</span>
                            <span class="stat-value">${stats.maxDepth}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Output Lines:</span>
                            <span class="stat-value">${formatted.split('\n').length}</span>
                        </div>
                    </div>
                    <div class="formatted-code">
                        <pre><code>${this.escapeHtml(formatted)}</code></pre>
                    </div>
                </div>
            `;
            resultDiv.innerHTML = html;
            
            // Update editor with formatted YAML
            if (this.editor) {
                this.editor.setValue(formatted, -1);
            }
            
            // Add copy button
            this.addCopyButtonToResult(resultDiv, formatted);
            
            // Scroll to result
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch (error) {
            const html = `
                <div class="result-error">
                    <div class="result-header">
                        <span class="result-icon">❌</span>
                        <h3>Cannot Format Invalid YAML</h3>
                    </div>
                    <div class="error-message">
                        <strong>Error:</strong> ${this.escapeHtml(error.message)}
                    </div>
                    <div class="error-suggestion">
                        💡 <strong>Suggestion:</strong> Use the "Validate YAML" button to identify and fix syntax errors first, then try formatting again.
                    </div>
                </div>
            `;
            resultDiv.innerHTML = html;
        }
    }

    getYAMLStats(obj, depth = 0) {
        let totalProperties = 0;
        let maxDepth = depth;
        
        if (typeof obj === 'object' && obj !== null) {
            if (Array.isArray(obj)) {
                totalProperties += obj.length;
                obj.forEach(item => {
                    const stats = this.getYAMLStats(item, depth + 1);
                    totalProperties += stats.totalProperties;
                    maxDepth = Math.max(maxDepth, stats.maxDepth);
                });
            } else {
                const keys = Object.keys(obj);
                totalProperties += keys.length;
                keys.forEach(key => {
                    const stats = this.getYAMLStats(obj[key], depth + 1);
                    totalProperties += stats.totalProperties;
                    maxDepth = Math.max(maxDepth, stats.maxDepth);
                });
            }
        }
        
        return {
            topLevelKeys: depth === 0 && typeof obj === 'object' && !Array.isArray(obj) ? Object.keys(obj).length : 0,
            totalProperties,
            maxDepth
        };
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    addCopyButtonToResult(resultDiv, textToCopy) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = '📋 Copy';
        copyBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 0.5rem 1rem;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s ease;
            z-index: 10;
        `;
        
        copyBtn.addEventListener('mouseover', () => {
            copyBtn.style.background = '#2563eb';
            copyBtn.style.transform = 'translateY(-2px)';
        });
        
        copyBtn.addEventListener('mouseout', () => {
            copyBtn.style.background = '#3b82f6';
            copyBtn.style.transform = 'translateY(0)';
        });
        
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(textToCopy);
                copyBtn.textContent = '✅ Copied!';
                copyBtn.style.background = '#10b981';
                
                setTimeout(() => {
                    copyBtn.textContent = '📋 Copy';
                    copyBtn.style.background = '#3b82f6';
                }, 2000);
            } catch (err) {
                console.error('Copy failed:', err);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = textToCopy;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    copyBtn.textContent = '✅ Copied!';
                    copyBtn.style.background = '#10b981';
                    setTimeout(() => {
                        copyBtn.textContent = '📋 Copy';
                        copyBtn.style.background = '#3b82f6';
                    }, 2000);
                } catch (err2) {
                    copyBtn.textContent = '❌ Failed';
                    copyBtn.style.background = '#ef4444';
                }
                document.body.removeChild(textArea);
            }
        });
        
        resultDiv.style.position = 'relative';
        resultDiv.appendChild(copyBtn);
    }

    convertYAML() {
        const input = this.getYAMLInput().trim();
        const resultDiv = document.getElementById('result-output');
        
        if (!input) {
            this.showResult(resultDiv, '💡 Please enter some YAML content to convert to JSON.', 'info');
            return;
        }

        try {
            // Parse YAML and convert to JSON
            const parsed = jsyaml.load(input);
            const jsonString = JSON.stringify(parsed, null, 2);
            
            // Get statistics
            const jsonSize = new Blob([jsonString]).size;
            const yamlSize = new Blob([input]).size;
            const compressionRatio = ((1 - jsonSize / yamlSize) * 100).toFixed(1);
            
            const html = `
                <div class="result-success">
                    <div class="result-header">
                        <span class="result-icon">🔄</span>
                        <h3>Converted to JSON Successfully</h3>
                    </div>
                    <div class="result-stats">
                        <div class="stat-item">
                            <span class="stat-label">YAML Size:</span>
                            <span class="stat-value">${yamlSize} bytes</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">JSON Size:</span>
                            <span class="stat-value">${jsonSize} bytes</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Size Difference:</span>
                            <span class="stat-value">${compressionRatio > 0 ? '+' : ''}${compressionRatio}%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">JSON Lines:</span>
                            <span class="stat-value">${jsonString.split('\n').length}</span>
                        </div>
                    </div>
                    <div class="formatted-code">
                        <pre><code>${this.escapeHtml(jsonString)}</code></pre>
                    </div>
                    <div class="conversion-tip">
                        💡 <strong>Tip:</strong> JSON format is more verbose but universally supported in all programming languages.
                    </div>
                </div>
            `;
            resultDiv.innerHTML = html;
            
            // Add copy button
            this.addCopyButtonToResult(resultDiv, jsonString);
            
            // Scroll to result
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch (error) {
            const html = `
                <div class="result-error">
                    <div class="result-header">
                        <span class="result-icon">❌</span>
                        <h3>Cannot Convert Invalid YAML</h3>
                    </div>
                    <div class="error-message">
                        <strong>Error:</strong> ${this.escapeHtml(error.message)}
                    </div>
                    <div class="error-suggestion">
                        💡 <strong>Suggestion:</strong> Use the "Validate YAML" button to identify and fix syntax errors first, then try conversion again.
                    </div>
                </div>
            `;
            resultDiv.innerHTML = html;
        }
    }

    clearAll() {
        if (this.editor) {
            this.editor.setValue('');
        } else {
            const element = document.getElementById('yaml-input');
            if (element) {
                element.value = '';
            }
        }
        document.getElementById('result-output').innerHTML = '';
        document.getElementById('result-output').className = 'result-box';
    }

    triggerTool(toolType) {
        // Add visual feedback to show which tool was triggered
        const resultDiv = document.getElementById('result-output');
        
        switch(toolType) {
            case 'validate':
                // Highlight the validate button
                this.highlightButton('validate-btn');
                // Show a hint message
                this.showResult(resultDiv, '💡 Click "Validate YAML" to check your YAML syntax and structure.', 'info');
                break;
            case 'format':
                // Highlight the format button
                this.highlightButton('format-btn');
                // Show a hint message
                this.showResult(resultDiv, '💡 Click "Format YAML" to beautify and format your YAML code.', 'info');
                break;
            case 'convert':
                // Highlight the convert button
                this.highlightButton('convert-btn');
                // Show a hint message
                this.showResult(resultDiv, '💡 Click "Convert to JSON" to transform your YAML into JSON format.', 'info');
                break;
        }
        
        // Focus on the input area
        if (this.editor) {
            this.editor.focus();
        } else {
        const inputArea = document.getElementById('yaml-input');
        if (inputArea) {
            inputArea.focus();
            }
        }
    }

    highlightButton(buttonId) {
        // Remove previous highlights
        document.querySelectorAll('.btn-primary').forEach(btn => {
            btn.classList.remove('highlighted');
        });
        
        // Add highlight to the specific button
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.add('highlighted');
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
                button.classList.remove('highlighted');
            }, 3000);
        }
    }

    showResult(element, message, type) {
        element.textContent = message;
        element.className = `result-box ${type}`;
        
        // Add copy button if result is successful
        if (type === 'success' && !element.querySelector('.copy-btn')) {
            this.addCopyButtonToElement(element);
        }
        
        // Smooth scroll to result
        element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
    }

    addCopyButtons() {
        // This will be called after dynamic content is added
        setTimeout(() => {
            const resultBoxes = document.querySelectorAll('.result-box.success');
            resultBoxes.forEach(box => {
                if (!box.querySelector('.copy-btn')) {
                    this.addCopyButtonToElement(box);
                }
            });
        }, 100);
    }

    addCopyButtonToElement(element) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            this.copyToClipboard(element.textContent);
            
            // Visual feedback
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.background = '#10b981';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '#2563eb';
            }, 2000);
        };
        
        element.appendChild(copyBtn);
    }

    async copyToClipboard(text) {
        try {
            // Remove the success/error prefixes for cleaner copy
            const cleanText = text.replace(/^[✅❌⚡🔄💡]\s*[^:]*:\s*\n*/, '');
            await navigator.clipboard.writeText(cleanText);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }

    setupExampleTabs() {
        // Setup example tabs functionality
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        if (tabButtons.length === 0) return; // No tabs found

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                const targetPanel = document.getElementById(targetTab);
                
                if (!targetPanel || button.classList.contains('active')) return;
                
                // Remove active class from all buttons and panels
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                
                // Add active class to clicked button and target panel
                button.classList.add('active');
                targetPanel.classList.add('active');
            });
        });

        // Add copy functionality to example code blocks
        this.addExampleCopyButtons();
    }

    addExampleCopyButtons() {
        // Add copy buttons to example code blocks
        const codeBlocks = document.querySelectorAll('.example-card-single .code-example pre code');
        
        codeBlocks.forEach(codeBlock => {
            const wrapper = codeBlock.closest('.code-example');
            if (wrapper && !wrapper.querySelector('.copy-btn')) {
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.textContent = '📋 Copy';
                copyBtn.style.cssText = `
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    padding: 0.5rem 1rem;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    z-index: 10;
                `;
                
                copyBtn.addEventListener('click', async () => {
                    try {
                        await navigator.clipboard.writeText(codeBlock.textContent);
                        copyBtn.textContent = '✅ Copied!';
                        copyBtn.style.background = '#10b981';
                        
                        setTimeout(() => {
                            copyBtn.textContent = '📋 Copy';
                            copyBtn.style.background = '#3b82f6';
                        }, 2000);
                    } catch (err) {
                        console.error('Copy failed:', err);
                        copyBtn.textContent = '❌ Failed';
                        copyBtn.style.background = '#ef4444';
                        
                        setTimeout(() => {
                            copyBtn.textContent = '📋 Copy';
                            copyBtn.style.background = '#3b82f6';
                        }, 2000);
                    }
                });
                
                wrapper.style.position = 'relative';
                wrapper.appendChild(copyBtn);
            }
        });
    }
}

// Load js-yaml library with multiple CDN fallbacks
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Try multiple CDNs in order
async function loadYAMLLibrary() {
    const cdnUrls = [
        'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js',
        'https://unpkg.com/js-yaml@4.1.0/dist/js-yaml.min.js',
        'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js'
    ];

    for (const url of cdnUrls) {
        try {
            console.log(`Trying to load js-yaml from: ${url}`);
            await loadScript(url);
            console.log(`Successfully loaded js-yaml from: ${url}`);
            return true;
        } catch (error) {
            console.warn(`Failed to load from ${url}:`, error);
            continue;
        }
    }
    
    throw new Error('All CDN sources failed');
}

// Basic YAML parser fallback (limited functionality)
function createBasicYAMLParser() {
    window.jsyaml = {
        load: function(yamlString) {
            try {
                // Very basic YAML parsing - handles simple key-value pairs
                const lines = yamlString.split('\n');
                const result = {};
                let currentIndent = 0;
                let currentObject = result;
                const indentStack = [result];
                
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
                    
                    const indent = line.length - line.trimStart().length;
                    const colonIndex = trimmedLine.indexOf(':');
                    
                    if (colonIndex === -1) continue;
                    
                    const key = trimmedLine.substring(0, colonIndex).trim();
                    let value = trimmedLine.substring(colonIndex + 1).trim();
                    
                    // Handle different value types
                    if (value === '') {
                        value = {};
                    } else if (value === 'true') {
                        value = true;
                    } else if (value === 'false') {
                        value = false;
                    } else if (value === 'null') {
                        value = null;
                    } else if (!isNaN(value) && value !== '') {
                        value = Number(value);
                    } else if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1);
                    } else if (value.startsWith("'") && value.endsWith("'")) {
                        value = value.slice(1, -1);
                    }
                    
                    currentObject[key] = value;
                }
                
                return result;
            } catch (error) {
                throw new Error(`YAML parsing error: ${error.message}`);
            }
        },
        
        dump: function(obj, options = {}) {
            const indent = options.indent || 2;
            
            function stringify(value, currentIndent = 0) {
                if (value === null) return 'null';
                if (typeof value === 'boolean') return value.toString();
                if (typeof value === 'number') return value.toString();
                if (typeof value === 'string') {
                    // Simple string quoting logic
                    if (value.includes('\n') || value.includes(':') || value.includes('#')) {
                        return `"${value.replace(/"/g, '\\"')}"`;
                    }
                    return value;
                }
                if (Array.isArray(value)) {
                    return value.map(item => 
                        '\n' + ' '.repeat(currentIndent + indent) + '- ' + stringify(item, currentIndent + indent)
                    ).join('');
                }
                if (typeof value === 'object') {
                    return Object.entries(value).map(([k, v]) => 
                        '\n' + ' '.repeat(currentIndent + indent) + k + ': ' + 
                        (typeof v === 'object' && v !== null ? stringify(v, currentIndent + indent) : stringify(v))
                    ).join('');
                }
                return String(value);
            }
            
            return Object.entries(obj).map(([key, value]) => 
                key + ':' + (typeof value === 'object' && value !== null ? stringify(value, 0) : ' ' + stringify(value))
            ).join('\n');
        }
    };
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Add a small delay to ensure DOM is fully loaded
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let yamlLibraryLoaded = false;
    
    try {
        // Try to load js-yaml from CDNs
        await loadYAMLLibrary();
        yamlLibraryLoaded = true;
        console.log('js-yaml library loaded successfully from CDN');
    } catch (error) {
        console.warn('Failed to load js-yaml from CDNs, using basic fallback parser:', error);
        
        try {
            // Use basic fallback parser
            createBasicYAMLParser();
            yamlLibraryLoaded = true;
            console.log('Basic YAML parser created successfully');
        } catch (fallbackError) {
            console.error('Failed to create basic parser, trying minimal mode:', fallbackError);
            
            try {
                // Last resort: use minimal parser
                initializeMinimalParser();
                yamlLibraryLoaded = true;
                console.log('Minimal YAML parser created successfully');
            } catch (minimalError) {
                console.error('All parser initialization methods failed:', minimalError);
            }
        }
    }
    
    // Now initialize the tools with whatever parser we have
    try {
        // Wait for DOM elements to be available
        await waitForElement('result-output');
        
        if (yamlLibraryLoaded && typeof window.jsyaml !== 'undefined') {
            // Initialize YAML tools with comprehensive validation
            window.yamlTools = new YAMLTools();
            
            console.log('YAML Tools initialized successfully!');
            
            // Show ready message
            const resultDiv = document.getElementById('result-output');
            if (resultDiv) {
                resultDiv.innerHTML = '✅ YAML Tools ready! Enter your YAML content above and click "Validate YAML" to check for errors.';
                resultDiv.className = 'result-box success';
            }
        } else {
            throw new Error('YAML library failed to load');
        }
        
    } catch (error) {
        console.error('Failed to initialize YAML tools:', error);
        
        // Show error message to user
        const resultDiv = document.getElementById('result-output');
        if (resultDiv) {
            resultDiv.innerHTML = `❌ Failed to initialize YAML tools. 
            <br><br><strong>Error:</strong> ${error.message}
            <br><br><strong>Troubleshooting:</strong>
            <ul style="text-align: left; margin: 1rem 0;">
                <li>Try refreshing the page</li>
                <li>Check your internet connection</li>
                <li>Disable browser extensions temporarily</li>
                <li>Try using an incognito/private window</li>
            </ul>`;
            resultDiv.className = 'result-box error';
        }
    }
});

// Wait for DOM element to be available
function waitForElement(id, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.getElementById(id);
        if (element) {
            resolve(element);
            return;
        }
        
        const startTime = Date.now();
        const checkElement = () => {
            const element = document.getElementById(id);
            if (element) {
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Element with id "${id}" not found within ${timeout}ms`));
            } else {
                setTimeout(checkElement, 50);
            }
        };
        
        checkElement();
    });
}

// Initialize minimal parser as last resort fallback
function initializeMinimalParser() {
    console.log('Initializing minimal YAML parser...');
    
    // Create a comprehensive YAML parser with advanced features
    window.jsyaml = {
        load: function(yamlString, options = {}) {
            if (!yamlString || typeof yamlString !== 'string') {
                throw new Error('Invalid YAML input: must be a non-empty string');
            }
            
            return parseYAML(yamlString, options);
        },
        
        dump: function(obj, options = {}) {
            const indent = options.indent || 2;
            const lineWidth = options.lineWidth || 80;
            const skipInvalid = options.skipInvalid || false;
            
            return stringifyYAML(obj, { indent, lineWidth, skipInvalid });
        }
    };
    
    // Comprehensive YAML parser
    function parseYAML(yamlString, options = {}) {
        const lines = yamlString.split('\n');
        const stack = [{}];
        let currentLevel = 0;
        let inMultiline = false;
        let multilineKey = '';
        let multilineType = '';
        let multilineContent = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // Skip empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                if (inMultiline && multilineType === '|') {
                    multilineContent.push('');
                }
                continue;
            }
            
            const indent = line.length - line.trimStart().length;
            
            // Handle multiline strings
            if (inMultiline) {
                if (indent > currentLevel || trimmedLine.startsWith('-') || trimmedLine.startsWith(' ')) {
                    if (multilineType === '|') {
                        multilineContent.push(line.substring(currentLevel + 2));
                    } else if (multilineType === '>') {
                        multilineContent.push(trimmedLine);
                    }
                    continue;
                } else {
                    // End multiline
                    const current = stack[stack.length - 1];
                    if (multilineType === '|') {
                        current[multilineKey] = multilineContent.join('\n');
                    } else if (multilineType === '>') {
                        current[multilineKey] = multilineContent.join(' ').trim();
                    }
                    inMultiline = false;
                    multilineContent = [];
                }
            }
            
            // Handle arrays
            if (trimmedLine.startsWith('- ')) {
                const value = trimmedLine.substring(2).trim();
                const current = stack[stack.length - 1];
                
                if (!Array.isArray(current.__array)) {
                    current.__array = [];
                }
                
                if (value.includes(':')) {
                    // Array of objects
                    const obj = {};
                    const [key, ...valueParts] = value.split(':');
                    const val = valueParts.join(':').trim();
                    obj[key.trim()] = parseValue(val);
                    current.__array.push(obj);
                } else {
                    current.__array.push(parseValue(value));
                }
                continue;
            }
            
            // Handle key-value pairs
            if (trimmedLine.includes(':')) {
                const colonIndex = trimmedLine.indexOf(':');
                const key = trimmedLine.substring(0, colonIndex).trim();
                const value = trimmedLine.substring(colonIndex + 1).trim();
                
                // Adjust stack based on indentation
                while (stack.length > 1 && indent <= currentLevel) {
                    const popped = stack.pop();
                    const parent = stack[stack.length - 1];
                    
                    if (popped.__array) {
                        parent[Object.keys(popped)[0]] = popped.__array;
                    }
                    
                    currentLevel -= (options.indent || 2);
                }
                
                const current = stack[stack.length - 1];
                
                // Check for multiline indicators
                if (value === '|' || value === '>') {
                    inMultiline = true;
                    multilineKey = key;
                    multilineType = value;
                    multilineContent = [];
                    currentLevel = indent;
                    continue;
                }
                
                // Handle nested objects
                if (!value || value === '') {
                    const nestedObj = {};
                    current[key] = nestedObj;
                    stack.push(nestedObj);
                    currentLevel = indent;
                } else {
                    current[key] = parseValue(value);
                }
            }
        }
        
        // Handle remaining multiline content
        if (inMultiline && multilineContent.length > 0) {
            const current = stack[stack.length - 1];
            if (multilineType === '|') {
                current[multilineKey] = multilineContent.join('\n');
            } else if (multilineType === '>') {
                current[multilineKey] = multilineContent.join(' ').trim();
            }
        }
        
        // Collapse stack and handle arrays
        while (stack.length > 1) {
            const popped = stack.pop();
            const parent = stack[stack.length - 1];
            
            if (popped.__array) {
                const keys = Object.keys(popped).filter(k => k !== '__array');
                if (keys.length === 1) {
                    parent[keys[0]] = popped.__array;
                }
            }
        }
        
        return stack[0];
    }
    
    // Parse individual values with type detection
    function parseValue(value) {
        if (!value || value === '') return '';
        
        // Handle quoted strings
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
            return value.slice(1, -1);
        }
        
        // Handle arrays in flow style
        if (value.startsWith('[') && value.endsWith(']')) {
            const items = value.slice(1, -1).split(',').map(item => item.trim());
            return items.map(parseValue);
        }
        
        // Handle objects in flow style
        if (value.startsWith('{') && value.endsWith('}')) {
            const obj = {};
            const pairs = value.slice(1, -1).split(',');
            pairs.forEach(pair => {
                const [k, v] = pair.split(':').map(s => s.trim());
                if (k && v !== undefined) {
                    obj[k] = parseValue(v);
                }
            });
            return obj;
        }
        
        // Handle special values
        if (value === 'null' || value === '~') return null;
        if (value === 'true') return true;
        if (value === 'false') return false;
        
        // Handle numbers
        if (/^-?\d+$/.test(value)) return parseInt(value, 10);
        if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
        if (/^-?\d+e[+-]?\d+$/i.test(value)) return parseFloat(value);
        
        // Handle dates
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(value);
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return new Date(value);
        
        // Return as string
        return value;
    }
    
    // Comprehensive YAML stringifier
    function stringifyYAML(obj, options = {}) {
        const indent = options.indent || 2;
        const currentIndent = options.currentIndent || 0;
        
        if (obj === null) return 'null';
        if (obj === undefined) return 'null';
        if (typeof obj === 'boolean') return obj.toString();
        if (typeof obj === 'number') return obj.toString();
        if (obj instanceof Date) return obj.toISOString();
        
        if (typeof obj === 'string') {
            // Handle multiline strings
            if (obj.includes('\n')) {
                const lines = obj.split('\n');
                return '|\n' + lines.map(line => 
                    ' '.repeat(currentIndent + indent) + line
                ).join('\n');
            }
            
            // Quote strings that need it
            if (obj.includes(':') || obj.includes('#') || obj.includes('[') || 
                obj.includes(']') || obj.includes('{') || obj.includes('}') ||
                obj.includes(',') || obj.startsWith(' ') || obj.endsWith(' ') ||
                ['true', 'false', 'null', '~'].includes(obj.toLowerCase()) ||
                /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(obj)) {
                return `"${obj.replace(/"/g, '\\"')}"`;
            }
            
            return obj;
        }
        
        if (Array.isArray(obj)) {
            if (obj.length === 0) return '[]';
            
            return obj.map(item => {
                const itemStr = stringifyYAML(item, { 
                    ...options, 
                    currentIndent: currentIndent + indent 
                });
                
                if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                    const lines = itemStr.split('\n');
                    return '- ' + lines[0] + '\n' + 
                           lines.slice(1).map(line => 
                               '  ' + line
                           ).join('\n');
                }
                
                return '- ' + itemStr;
            }).join('\n' + ' '.repeat(currentIndent));
        }
        
        if (typeof obj === 'object') {
            const entries = Object.entries(obj);
            if (entries.length === 0) return '{}';
            
            return entries.map(([key, value]) => {
                const keyStr = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? key : `"${key}"`;
                const valueStr = stringifyYAML(value, { 
                    ...options, 
                    currentIndent: currentIndent + indent 
                });
                
                if (typeof value === 'object' && value !== null) {
                    if (Array.isArray(value) && value.length > 0) {
                        return keyStr + ':\n' + ' '.repeat(currentIndent + indent) + 
                               valueStr.split('\n').join('\n' + ' '.repeat(currentIndent + indent));
                    } else if (!Array.isArray(value) && Object.keys(value).length > 0) {
                        return keyStr + ':\n' + 
                               valueStr.split('\n').map(line => 
                                   ' '.repeat(currentIndent + indent) + line
                               ).join('\n');
                    }
                }
                
                return keyStr + ': ' + valueStr;
            }).join('\n' + ' '.repeat(currentIndent));
        }
        
        return String(obj);
    }
    
    // Note: Parser is ready, main initialization will handle the rest
    console.log('Minimal YAML parser created successfully');
}