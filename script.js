// YAML Tools - Enhanced JavaScript File with Better Error Handling
class YAMLTools {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupExampleData();
    }

    bindEvents() {
        // Validator events
        document.getElementById('validate-btn').addEventListener('click', () => this.validateYAML());
        document.getElementById('clear-validator').addEventListener('click', () => this.clearValidator());

        // Linter events
        document.getElementById('lint-btn').addEventListener('click', () => this.lintYAML());
        document.getElementById('clear-linter').addEventListener('click', () => this.clearLinter());


        // Converter events
        document.getElementById('convert-btn').addEventListener('click', () => this.convertYAMLToJSON());
        document.getElementById('clear-converter').addEventListener('click', () => this.clearConverter());

        // Add copy functionality to result boxes
        this.addCopyButtons();
    }

    setupExampleData() {
        const exampleYAML = `name: John Doe
age: 30
email: john@example.com
address:
  street: 123 Main St
  city: New York
  country: USA
hobbies:
  - reading
  - coding
  - hiking
skills:
  programming: advanced
  languages: [JavaScript, Python, Go]
  experience: 5 years
active: true
metadata:
  created: 2024-01-15
  version: 1.0`;

        document.getElementById('yaml-input').value = exampleYAML;
        document.getElementById('yaml-lint-input').value = exampleYAML;
        document.getElementById('yaml-convert-input').value = exampleYAML;
    }

    addCopyButtons() {
        const resultBoxes = document.querySelectorAll('.result-box');
        resultBoxes.forEach(box => {
            if (!box.querySelector('.copy-btn')) {
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.textContent = 'Copy';
                copyBtn.style.position = 'absolute';
                copyBtn.style.top = '0.5rem';
                copyBtn.style.right = '0.5rem';
                copyBtn.addEventListener('click', () => this.copyToClipboard(box.textContent, copyBtn));
                box.style.position = 'relative';
                box.appendChild(copyBtn);
            }
        });
    }

    async copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.style.background = '#10b981';
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '#2563eb';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }

    // YAML Validator
    validateYAML() {
        const input = document.getElementById('yaml-input').value.trim();
        const resultBox = document.getElementById('validation-result');
        
        if (!input) {
            this.showResult(resultBox, 'Please enter some YAML content to validate.', 'error');
            return;
        }

        try {
            const result = this.parseYAML(input);
            if (result.success) {
                this.showResult(resultBox, `✅ Valid YAML!\n\nParsed structure:\n${JSON.stringify(result.data, null, 2)}`, 'success');
            } else {
                this.showResult(resultBox, `❌ Invalid YAML!\n\nError: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showResult(resultBox, `❌ Validation failed!\n\nError: ${error.message}`, 'error');
        }
    }

    clearValidator() {
        document.getElementById('yaml-input').value = '';
        document.getElementById('validation-result').innerHTML = '';
    }

    // YAML Linter/Formatter
    lintYAML() {
        const input = document.getElementById('yaml-lint-input').value.trim();
        const resultBox = document.getElementById('lint-result');
        
        if (!input) {
            this.showResult(resultBox, 'Please enter some YAML content to format.', 'error');
            return;
        }

        try {
            const result = this.parseYAML(input);
            if (result.success) {
                const formatted = this.formatYAML(result.data);
                this.showResult(resultBox, `✅ YAML formatted successfully!\n\n${formatted}`, 'success');
            } else {
                this.showResult(resultBox, `❌ Cannot format invalid YAML!\n\nError: ${result.error}\n\nPlease fix the syntax errors first, then try formatting again.`, 'error');
            }
        } catch (error) {
            this.showResult(resultBox, `❌ Formatting failed!\n\nError: ${error.message}`, 'error');
        }
    }

    clearLinter() {
        document.getElementById('yaml-lint-input').value = '';
        document.getElementById('lint-result').innerHTML = '';
    }


    // YAML to JSON Converter
    convertYAMLToJSON() {
        const input = document.getElementById('yaml-convert-input').value.trim();
        const resultBox = document.getElementById('convert-result');
        
        if (!input) {
            this.showResult(resultBox, 'Please enter some YAML content to convert.', 'error');
            return;
        }

        try {
            const result = this.parseYAML(input);
            if (result.success) {
                const jsonString = JSON.stringify(result.data, null, 2);
                this.showResult(resultBox, `✅ YAML converted to JSON successfully!\n\n${jsonString}`, 'success');
            } else {
                this.showResult(resultBox, `❌ Cannot convert invalid YAML!\n\nError: ${result.error}\n\nPlease fix the syntax errors first, then try converting again.`, 'error');
            }
        } catch (error) {
            this.showResult(resultBox, `❌ Conversion failed!\n\nError: ${error.message}`, 'error');
        }
    }

    clearConverter() {
        document.getElementById('yaml-convert-input').value = '';
        document.getElementById('convert-result').innerHTML = '';
    }

    // Enhanced YAML parsing function with better error handling
    parseYAML(input) {
        try {
            const data = this.yamlToObject(input);
            return { success: true, data: data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Improved YAML parser implementation
    yamlToObject(yaml) {
        const lines = yaml.split('\n');
        const result = {};
        const stack = [{ obj: result, indent: -1, lastKey: null }];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith('#')) {
                continue;
            }
            
            const indent = line.match(/^(\s*)/)[1].length;
            
            // Handle list items
            if (trimmed.startsWith('- ')) {
                // Adjust stack based on indentation
                while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
                    stack.pop();
                }
                
                const current = stack[stack.length - 1];
                const currentObj = current.obj;
                
                // Find the appropriate parent key
                let parentKey = current.lastKey;
                
                // If no parent key at current level, look for keys in current object
                if (!parentKey) {
                    const keys = Object.keys(currentObj);
                    if (keys.length > 0) {
                        parentKey = keys[keys.length - 1];
                        // Check if the last key is empty (should become an array)
                        if (typeof currentObj[parentKey] === 'object' && 
                            !Array.isArray(currentObj[parentKey]) && 
                            Object.keys(currentObj[parentKey]).length === 0) {
                            currentObj[parentKey] = [];
                        }
                    }
                }
                
                if (!parentKey) {
                    throw new Error(`Invalid YAML syntax at line ${i + 1}: list item without parent key`);
                }
                
                // Convert to array if not already
                if (!Array.isArray(currentObj[parentKey])) {
                    currentObj[parentKey] = [];
                }
                
                const arrayValue = this.parseValue(trimmed.substring(2));
                currentObj[parentKey].push(arrayValue);
                continue;
            }
            
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) {
                throw new Error(`Invalid YAML syntax at line ${i + 1}: missing colon in "${trimmed}"`);
            }
            
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            
            // Validate key
            if (!key) {
                throw new Error(`Invalid YAML syntax at line ${i + 1}: empty key`);
            }
            
            // Adjust stack based on indentation
            while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
                stack.pop();
            }
            
            const current = stack[stack.length - 1];
            const currentObj = current.obj;
            
            if (value === '') {
                // This is a parent object that might become an array
                currentObj[key] = {};
                stack.push({ obj: currentObj[key], indent: indent, lastKey: key });
            } else if (value.startsWith('- ')) {
                // This is an inline array item
                currentObj[key] = [];
                const arrayValue = this.parseValue(value.substring(2));
                currentObj[key].push(arrayValue);
                current.lastKey = key;
            } else {
                // This is a simple key-value pair
                currentObj[key] = this.parseValue(value);
                current.lastKey = key;
            }
        }
        
        return result;
    }

    parseValue(value) {
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
            return value.slice(1, -1);
        }
        
        // Parse boolean values
        if (value === 'true') return true;
        if (value === 'false') return false;
        
        // Parse null values
        if (value === 'null' || value === '~') return null;
        
        // Parse numbers
        if (!isNaN(value) && !isNaN(parseFloat(value))) {
            return parseFloat(value);
        }
        
        // Parse arrays
        if (value.startsWith('[') && value.endsWith(']')) {
            const arrayContent = value.slice(1, -1).trim();
            if (arrayContent === '') return [];
            return arrayContent.split(',').map(item => this.parseValue(item.trim()));
        }
        
        // Return as string
        return value;
    }

    // Format YAML from object
    formatYAML(obj, indent = 0) {
        const spaces = '  '.repeat(indent);
        let result = '';
        
        for (const [key, value] of Object.entries(obj)) {
            if (Array.isArray(value)) {
                result += `${spaces}${key}:\n`;
                value.forEach(item => {
                    result += `${spaces}  - ${this.formatValue(item)}\n`;
                });
            } else if (typeof value === 'object' && value !== null) {
                result += `${spaces}${key}:\n`;
                result += this.formatYAML(value, indent + 1);
            } else {
                result += `${spaces}${key}: ${this.formatValue(value)}\n`;
            }
        }
        
        return result;
    }

    formatValue(value) {
        if (typeof value === 'string') {
            // Add quotes if the string contains special characters
            if (value.includes(':') || value.includes('#') || value.includes('|') || value.includes('>')) {
                return `"${value}"`;
            }
            return value;
        }
        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }
        if (value === null) {
            return 'null';
        }
        return String(value);
    }

    // Show result in result box
    showResult(resultBox, content, type = 'info') {
        resultBox.textContent = content;
        resultBox.className = `result-box ${type}`;
        this.addCopyButtons(); // Re-add copy button
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new YAMLTools();
});

// Add smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add loading states to buttons
function addLoadingState(button, text = 'Processing...') {
    const originalText = button.textContent;
    button.textContent = text;
    button.disabled = true;
    button.style.opacity = '0.7';
    
    return () => {
        button.textContent = originalText;
        button.disabled = false;
        button.style.opacity = '1';
    };
}

// Enhanced error handling
window.addEventListener('error', (e) => {
    console.error('YAML Tools Error:', e.error);
});

// Service Worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker can be added here for offline functionality
    });
}
