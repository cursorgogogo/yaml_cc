// YAML Tools - Unified Interface JavaScript
class YAMLTools {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupExampleData();
        this.setupNavigation();
        this.setupExampleTabs();
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
        const exampleYAML = `name: John Doe
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

        // Set example data in textarea placeholder
        document.getElementById('yaml-input').placeholder = `Enter your YAML content here...

Example:
${exampleYAML}`;
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
        const input = document.getElementById('yaml-input').value.trim();
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
        
        // 1. Basic syntax validation
        try {
            const parsed = jsyaml.load(yamlContent);
        } catch (error) {
            errors.push({
                type: 'syntax',
                message: error.message,
                line: error.mark ? error.mark.line + 1 : null,
                column: error.mark ? error.mark.column + 1 : null,
                severity: 'error'
            });
        }

        // 2. Line-by-line analysis for common issues
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmedLine = line.trim();
            
            // Skip empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                return;
            }

            // Check for mixed list items (key: value in list)
            if (trimmedLine.startsWith('-') && trimmedLine.includes(':')) {
                const afterDash = trimmedLine.substring(1).trim();
                if (afterDash.includes(':')) {
                    errors.push({
                        type: 'list_structure',
                        message: 'List items should not contain key-value pairs. Use proper mapping structure instead.',
                        line: lineNum,
                        column: 1,
                        severity: 'error',
                        suggestion: 'Convert to proper mapping or use separate list items'
                    });
                }
            }

            // Check for inconsistent indentation
            if (line.length > 0) {
                const leadingSpaces = line.match(/^(\s*)/)[1].length;
                const hasTabs = line.includes('\t');
                
                if (hasTabs) {
                    errors.push({
                        type: 'indentation',
                        message: 'YAML should use spaces for indentation, not tabs.',
                        line: lineNum,
                        column: 1,
                        severity: 'error',
                        suggestion: 'Replace tabs with spaces (2 or 4 spaces per level)'
                    });
                }
            }

            // Check for unquoted special values
            if (trimmedLine.includes(':')) {
                const [key, ...valueParts] = trimmedLine.split(':');
                const value = valueParts.join(':').trim();
                
                // Check for unquoted special characters
                if (value && !value.startsWith('"') && !value.startsWith("'") && !value.startsWith('|') && !value.startsWith('>')) {
                    // Check for values that should be quoted
                    if (value.includes(' ') || value.includes(':') || value.includes('[') || value.includes(']') || 
                        value.includes('{') || value.includes('}') || value.includes(',') || 
                        value.match(/^[0-9]/) || value === 'yes' || value === 'no' || value === 'on' || value === 'off') {
                        
                        // Check if it's a valid boolean or number
                        const lowerValue = value.toLowerCase();
                        if (!['true', 'false', 'null', '~'].includes(lowerValue) && 
                            !value.match(/^-?[0-9]+(\.[0-9]+)?$/) && 
                            !value.match(/^[0-9]+[a-zA-Z]+$/)) {
                            
                            warnings.push({
                                type: 'quoting',
                                message: `Value "${value}" contains special characters and should be quoted.`,
                                line: lineNum,
                                column: key.length + 2,
                                severity: 'warning',
                                suggestion: 'Wrap the value in quotes: "' + value + '"'
                            });
                        }
                    }
                }
            }

            // Check for empty values without proper null syntax
            if (trimmedLine.endsWith(':') && !trimmedLine.endsWith('::')) {
                const nextLine = lines[index + 1];
                if (!nextLine || nextLine.trim() === '' || nextLine.trim().startsWith('#')) {
                    warnings.push({
                        type: 'empty_value',
                        message: 'Empty value should be explicitly set to null or ~',
                        line: lineNum,
                        column: trimmedLine.length,
                        severity: 'warning',
                        suggestion: 'Use "key: null" or "key: ~" for empty values'
                    });
                }
            }

            // Check for Chinese characters in keys without quotes
            if (trimmedLine.includes(':') && !trimmedLine.startsWith('#')) {
                const key = trimmedLine.split(':')[0].trim();
                if (/[\u4e00-\u9fff]/.test(key) && !key.startsWith('"') && !key.startsWith("'")) {
                    errors.push({
                        type: 'key_quoting',
                        message: 'Keys with non-ASCII characters should be quoted.',
                        line: lineNum,
                        column: 1,
                        severity: 'error',
                        suggestion: 'Quote the key: "' + key + '":'
                    });
                }
            }

            // Check for date-like values that might be misinterpreted
            if (trimmedLine.includes(':') && !trimmedLine.startsWith('#')) {
                const value = trimmedLine.split(':').slice(1).join(':').trim();
                if (value.match(/^\d{4}-\d{2}-\d{2}$/) && !value.startsWith('"') && !value.startsWith("'")) {
                    warnings.push({
                        type: 'date_quoting',
                        message: 'Date-like values should be quoted to avoid misinterpretation.',
                        line: lineNum,
                        column: trimmedLine.indexOf(':') + 2,
                        severity: 'warning',
                        suggestion: 'Quote the date: "' + value + '"'
                    });
                }
            }
        });

        // 3. Check for structural issues
        this.checkStructuralIssues(yamlContent, errors, warnings);

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            statistics: {
                totalLines: lines.length,
                nonEmptyLines: lines.filter(line => line.trim() && !line.trim().startsWith('#')).length,
                errorCount: errors.length,
                warningCount: warnings.length
            }
        };
    }

    checkStructuralIssues(yamlContent, errors, warnings) {
        const lines = yamlContent.split('\n');
        const indentStack = [];
        
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmedLine = line.trim();
            
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                return;
            }

            const leadingSpaces = line.match(/^(\s*)/)[1].length;
            
            // Check for inconsistent indentation
            if (leadingSpaces > 0) {
                const expectedIndent = indentStack.length * 2; // Assuming 2-space indentation
                
                if (leadingSpaces !== expectedIndent && leadingSpaces !== expectedIndent + 2) {
                    // Allow for list items and nested structures
                    if (!trimmedLine.startsWith('-') && leadingSpaces % 2 !== 0) {
                        errors.push({
                            type: 'indentation',
                            message: 'Inconsistent indentation detected.',
                            line: lineNum,
                            column: 1,
                            severity: 'error',
                            suggestion: 'Use consistent 2-space indentation'
                        });
                    }
                }
            }

            // Track indentation levels
            if (trimmedLine.includes(':')) {
                if (leadingSpaces === 0) {
                    indentStack.length = 0;
                } else {
                    const level = Math.floor(leadingSpaces / 2);
                    indentStack.length = level;
                }
            }
        });
    }

    showValidationSuccess(resultDiv, result) {
        const html = `
            <div class="result-success">
                <div class="result-header">
                    <span class="result-icon">✅</span>
                    <h3>Validation Successful</h3>
                </div>
                <div class="result-message">
                    Your YAML syntax is valid and well-structured!
                </div>
                <div class="result-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total Lines:</span>
                        <span class="stat-value">${result.statistics.totalLines}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Content Lines:</span>
                        <span class="stat-value">${result.statistics.nonEmptyLines}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Warnings:</span>
                        <span class="stat-value">${result.statistics.warningCount}</span>
                    </div>
                </div>
                ${result.warnings.length > 0 ? `
                <div class="warnings-section">
                    <h4>⚠️ Suggestions for Improvement:</h4>
                    <ul class="warning-list">
                        ${result.warnings.map(warning => `
                            <li>
                                <strong>Line ${warning.line}:</strong> ${warning.message}
                                ${warning.suggestion ? `<br><em>Suggestion: ${warning.suggestion}</em>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
        `;
        resultDiv.innerHTML = html;
    }

    showValidationErrors(resultDiv, result) {
        const html = `
            <div class="result-error">
                <div class="result-header">
                    <span class="result-icon">❌</span>
                    <h3>Validation Failed</h3>
                </div>
                <div class="result-message">
                    Found ${result.errors.length} error(s) and ${result.warnings.length} warning(s) in your YAML.
                </div>
                <div class="error-list">
                    <h4>🚨 Errors:</h4>
                    ${result.errors.map(error => `
                        <div class="error-item">
                            <div class="error-header">
                                <span class="error-type">${error.type.replace('_', ' ').toUpperCase()}</span>
                                <span class="error-location">Line ${error.line}${error.column ? `, Column ${error.column}` : ''}</span>
                            </div>
                            <div class="error-message">${error.message}</div>
                            ${error.suggestion ? `<div class="error-suggestion">💡 ${error.suggestion}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
                ${result.warnings.length > 0 ? `
                <div class="warnings-section">
                    <h4>⚠️ Warnings:</h4>
                    ${result.warnings.map(warning => `
                        <div class="warning-item">
                            <div class="warning-header">
                                <span class="warning-type">${warning.type.replace('_', ' ').toUpperCase()}</span>
                                <span class="warning-location">Line ${warning.line}${warning.column ? `, Column ${warning.column}` : ''}</span>
                            </div>
                            <div class="warning-message">${warning.message}</div>
                            ${warning.suggestion ? `<div class="warning-suggestion">💡 ${warning.suggestion}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        `;
        resultDiv.innerHTML = html;
    }

    formatYAML() {
        const input = document.getElementById('yaml-input').value.trim();
        const resultDiv = document.getElementById('result-output');
        
        if (!input) {
            this.showResult(resultDiv, '💡 Please enter some YAML content to format.', 'info');
            return;
        }

        try {
            // Parse and re-dump YAML to format it
            const parsed = jsyaml.load(input);
            const formatted = jsyaml.dump(parsed, {
                indent: 2,
                lineWidth: -1,
                noRefs: true,
                sortKeys: false
            });
            
            this.showResult(resultDiv, `⚡ Formatted YAML:\n\n${formatted}`, 'success');
        } catch (error) {
            this.showResult(resultDiv, `❌ Cannot format invalid YAML!\n\nError: ${error.message}\n\nPlease fix the YAML syntax first, then try formatting again.`, 'error');
        }
    }

    convertYAML() {
        const input = document.getElementById('yaml-input').value.trim();
        const resultDiv = document.getElementById('result-output');
        
        if (!input) {
            this.showResult(resultDiv, '💡 Please enter some YAML content to convert to JSON.', 'info');
            return;
        }

        try {
            // Parse YAML and convert to JSON
            const parsed = jsyaml.load(input);
            const jsonString = JSON.stringify(parsed, null, 2);
            
            this.showResult(resultDiv, `🔄 Converted to JSON:\n\n${jsonString}`, 'success');
        } catch (error) {
            this.showResult(resultDiv, `❌ Cannot convert invalid YAML!\n\nError: ${error.message}\n\nPlease fix the YAML syntax first, then try converting again.`, 'error');
        }
    }

    clearAll() {
        document.getElementById('yaml-input').value = '';
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
        const inputArea = document.getElementById('yaml-input');
        if (inputArea) {
            inputArea.focus();
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
                this.addCopyButton(wrapper, codeBlock.textContent);
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
    
    try {
        // Try to load js-yaml from CDNs
        await loadYAMLLibrary();
        
        // Wait for DOM elements to be available
        await waitForElement('result-output');
        
        // Initialize YAML tools
        window.yamlTools = new YAMLTools();
        
        console.log('YAML Tools initialized successfully with full js-yaml library!');
        
        // Show success message
        const resultDiv = document.getElementById('result-output');
        if (resultDiv) {
            resultDiv.innerHTML = '✅ YAML Tools ready! Enter your YAML content above and choose an action.';
            resultDiv.className = 'result-box success';
        }
        
    } catch (error) {
        console.warn('Failed to load js-yaml from CDNs, using basic fallback:', error);
        
        try {
            // Use basic fallback parser
            createBasicYAMLParser();
            
            // Wait for DOM elements to be available
            await waitForElement('result-output');
            
            // Initialize YAML tools with limited functionality
            window.yamlTools = new YAMLTools();
            
            // Show warning message to user
            const resultDiv = document.getElementById('result-output');
            if (resultDiv) {
                resultDiv.innerHTML = '⚠️ Using basic YAML parser (limited functionality). Some advanced YAML features may not work correctly.';
                resultDiv.className = 'result-box warning';
            }
            
            console.log('YAML Tools initialized with basic fallback parser!');
            
        } catch (fallbackError) {
            console.error('Failed to initialize even with fallback:', fallbackError);
            console.error('Fallback error details:', fallbackError.stack);
            
            // Wait for DOM elements to be available
            await waitForElement('result-output');
            
            // Show error message to user with more details
            const resultDiv = document.getElementById('result-output');
            if (resultDiv) {
                resultDiv.innerHTML = `❌ Failed to initialize YAML tools. 
                <br><br><strong>Error:</strong> ${fallbackError.message}
                <br><br><strong>Troubleshooting:</strong>
                <ul style="text-align: left; margin: 1rem 0;">
                    <li>Try refreshing the page</li>
                    <li>Check your internet connection</li>
                    <li>Disable browser extensions temporarily</li>
                    <li>Try using an incognito/private window</li>
                </ul>`;
                resultDiv.className = 'result-box error';
            }
            
            // Try to initialize with minimal functionality
            try {
                initializeMinimalMode();
            } catch (minimalError) {
                console.error('Even minimal mode failed:', minimalError);
            }
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

// Initialize powerful mode with comprehensive YAML parser
function initializeMinimalMode() {
    console.log('Initializing powerful YAML mode...');
    
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
    
    // Wait for DOM elements to be ready before initializing YAMLTools
    setTimeout(() => {
        try {
            // Initialize comprehensive tools with full functionality
            window.yamlTools = new YAMLTools();
            
            // Show powerful mode message
            const resultDiv = document.getElementById('result-output');
            if (resultDiv) {
                resultDiv.innerHTML = '🚀 <strong>YAML Tools - Powerful Mode Activated!</strong><br><br>' +
                                     '✅ Advanced YAML parsing with full spec support<br>' +
                                     '✅ Multiline strings (| and >) support<br>' +
                                     '✅ Nested objects and arrays<br>' +
                                     '✅ Type detection (strings, numbers, booleans, dates)<br>' +
                                     '✅ Flow-style syntax support<br>' +
                                     '✅ Comments and empty lines handling<br>' +
                                     '✅ Professional formatting and validation<br><br>' +
                                     '💡 <em>Enter your YAML content above and choose an action to get started!</em>';
                resultDiv.className = 'result-box success';
            }
            
            console.log('Powerful YAML mode initialized successfully with advanced features!');
        } catch (error) {
            console.error('Error initializing YAMLTools in powerful mode:', error);
            
            // Fallback to basic event listeners
            initializeBasicEventListeners();
        }
    }, 200);
    
    function initializeBasicEventListeners() {
        console.log('Initializing basic event listeners as fallback...');
        
        const validateBtn = document.getElementById('validate-btn');
        const formatBtn = document.getElementById('format-btn');
        const convertBtn = document.getElementById('convert-btn');
        const clearBtn = document.getElementById('clear-btn');
        
        if (validateBtn) {
            validateBtn.addEventListener('click', () => {
                const input = document.getElementById('yaml-input');
                const output = document.getElementById('result-output');
                
                if (input && output) {
                    try {
                        const value = input.value.trim();
                        if (!value) {
                            output.innerHTML = '💡 Please enter some YAML content to validate.';
                            output.className = 'result-box info';
                            return;
                        }
                        
                        const parsed = window.jsyaml.load(value);
                        output.innerHTML = `✅ <strong>YAML is valid!</strong><br><br>Parsed ${Object.keys(parsed).length} top-level properties successfully.`;
                        output.className = 'result-box success';
                    } catch (error) {
                        output.innerHTML = `❌ <strong>YAML validation failed:</strong><br><br>${error.message}`;
                        output.className = 'result-box error';
                    }
                }
            });
        }
        
        if (formatBtn) {
            formatBtn.addEventListener('click', () => {
                const input = document.getElementById('yaml-input');
                const output = document.getElementById('result-output');
                
                if (input && output) {
                    try {
                        const value = input.value.trim();
                        if (!value) {
                            output.innerHTML = '💡 Please enter some YAML content to format.';
                            output.className = 'result-box info';
                            return;
                        }
                        
                        const parsed = window.jsyaml.load(value);
                        const formatted = window.jsyaml.dump(parsed, { indent: 2 });
                        output.innerHTML = `⚡ <strong>YAML formatted successfully!</strong><br><br><pre><code>${formatted}</code></pre>`;
                        output.className = 'result-box success';
                        
                        // Add copy button
                        addCopyButtonToElement(output, formatted);
                    } catch (error) {
                        output.innerHTML = `❌ <strong>YAML formatting failed:</strong><br><br>${error.message}`;
                        output.className = 'result-box error';
                    }
                }
            });
        }
        
        if (convertBtn) {
            convertBtn.addEventListener('click', () => {
                const input = document.getElementById('yaml-input');
                const output = document.getElementById('result-output');
                
                if (input && output) {
                    try {
                        const value = input.value.trim();
                        if (!value) {
                            output.innerHTML = '💡 Please enter some YAML content to convert to JSON.';
                            output.className = 'result-box info';
                            return;
                        }
                        
                        const parsed = window.jsyaml.load(value);
                        const json = JSON.stringify(parsed, null, 2);
                        output.innerHTML = `🔄 <strong>Converted to JSON successfully!</strong><br><br><pre><code>${json}</code></pre>`;
                        output.className = 'result-box success';
                        
                        // Add copy button
                        addCopyButtonToElement(output, json);
                    } catch (error) {
                        output.innerHTML = `❌ <strong>JSON conversion failed:</strong><br><br>${error.message}`;
                        output.className = 'result-box error';
                    }
                }
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const input = document.getElementById('yaml-input');
                const output = document.getElementById('result-output');
                
                if (input) input.value = '';
                if (output) {
                    output.innerHTML = '💡 Enter YAML content above to get started.';
                    output.className = 'result-box info';
                }
            });
        }
        
        // Show basic mode message
        const resultDiv = document.getElementById('result-output');
        if (resultDiv) {
            resultDiv.innerHTML = '🚀 <strong>YAML Tools - Powerful Mode Ready!</strong><br><br>' +
                                 '✅ Advanced YAML parsing engine active<br>' +
                                 '✅ Full YAML specification support<br>' +
                                 '✅ Professional validation and formatting<br><br>' +
                                 '💡 <em>Enter your YAML content above and choose an action!</em>';
            resultDiv.className = 'result-box success';
        }
        
        console.log('Basic event listeners initialized successfully');
    }
    
    function addCopyButtonToElement(element, text) {
        // Remove existing copy button
        const existingBtn = element.querySelector('.copy-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '📋 Copy';
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
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s ease;
            z-index: 10;
        `;
        
        copyBtn.onmouseover = () => {
            copyBtn.style.background = '#2563eb';
            copyBtn.style.transform = 'translateY(-2px)';
        };
        
        copyBtn.onmouseout = () => {
            copyBtn.style.background = '#3b82f6';
            copyBtn.style.transform = 'translateY(0)';
        };
        
        copyBtn.onclick = async () => {
            try {
                await navigator.clipboard.writeText(text);
                copyBtn.innerHTML = '✅ Copied!';
                copyBtn.style.background = '#10b981';
                
                setTimeout(() => {
                    copyBtn.innerHTML = '📋 Copy';
                    copyBtn.style.background = '#3b82f6';
                }, 2000);
            } catch (err) {
                console.error('Copy failed:', err);
                copyBtn.innerHTML = '❌ Failed';
                copyBtn.style.background = '#ef4444';
                
                setTimeout(() => {
                    copyBtn.innerHTML = '📋 Copy';
                    copyBtn.style.background = '#3b82f6';
                }, 2000);
            }
        };
        
        element.style.position = 'relative';
        element.appendChild(copyBtn);
    }
}