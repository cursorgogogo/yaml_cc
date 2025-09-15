// YAML Tools - Unified Interface JavaScript
class YAMLTools {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupExampleData();
        this.setupNavigation();
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
                e.preventDefault();
                
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

        try {
            // Parse YAML using js-yaml library
            const parsed = jsyaml.load(input);
            
            // If parsing succeeds, YAML is valid
            this.showResult(resultDiv, '✅ Valid YAML!\n\nYour YAML syntax is correct and can be parsed successfully.\n\nStructure looks good! 🎉', 'success');
        } catch (error) {
            // If parsing fails, show error details
            this.showResult(resultDiv, `❌ Invalid YAML!\n\nError: ${error.message}\n\nPlease check your YAML syntax and try again.\n\nTip: Make sure your indentation is consistent and uses spaces (not tabs).`, 'error');
        }
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
}

// Load js-yaml library and initialize tools
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load js-yaml library from CDN
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js');
        
        // Initialize YAML tools
        window.yamlTools = new YAMLTools();
        
        console.log('YAML Tools initialized successfully!');
    } catch (error) {
        console.error('Failed to load YAML Tools:', error);
        
        // Show error message to user
        const resultDiv = document.getElementById('result-output');
        if (resultDiv) {
            resultDiv.innerHTML = '❌ Failed to load YAML library. Please check your internet connection and refresh the page.';
            resultDiv.className = 'result-box error';
        }
    }
});