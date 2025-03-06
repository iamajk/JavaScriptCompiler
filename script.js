document.addEventListener('DOMContentLoaded', async () => {
    const output = document.getElementById('output');
     const themeToggle = document.getElementById('themeToggle');
      const moonIcon = document.getElementById('moonIcon');
      const sunIcon = document.getElementById('sunIcon');
       const savedCodeContainer = document.querySelector('.saved-code-container');
    let editor;

    const MAX_LINES = 1000; // Maximum lines allowed in the output
    const MAX_CHARS = 5000; // Maximum characters allowed in the output

    // Create a virtual container for output
    const outputContainer = document.createElement('div');
    output.appendChild(outputContainer);

    // Create a sandbox object for isolated DOM and console manipulation
    const sandboxDocument = {
        createElement: (...args) => document.createElement(...args),
        getElementById: id => outputContainer.querySelector(`#${id}`),
        querySelector: selector => outputContainer.querySelector(selector),
        querySelectorAll: selector => outputContainer.querySelectorAll(selector),
        body: outputContainer,
        appendChild: (...args) => outputContainer.appendChild(...args),
        write: (html) => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            outputContainer.appendChild(tempDiv);
        },
        console: {
            log: createConsoleMethod('log'),
            error: createConsoleMethod('error'),
            warn: createConsoleMethod('warn')
        }
    };

    // Initialize CodeMirror for JavaScript
editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
    lineNumbers: true,
    mode: 'javascript',
    theme: 'default',
    lineWrapping: true,
    inputStyle: 'textarea',
    extraKeys: {
        "Ctrl-Space": "autocomplete", // Trigger autocomplete
    },
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
});

function customJavaScriptHint(editor) {
    const cursor = editor.getCursor();
    const token = editor.getTokenAt(cursor);
    const currentWord = token.string;

 const jsKeywords = [
     "var", "let", "const", "function", "return", "if", "else", "for", "while",
     "do", "switch", "case", "break", "continue", "try", "catch", "finally",
     "throw", "class", "extends", "constructor", "this", "new", "typeof", "instanceof",
     "true", "false", "null", "undefined", "console", "alert", "document", "window", "write",
     "super", "static", "get", "set", "yield", "async", "await", "import", "export",
     "default", "from", "as", "with", "delete", "in", "of", "void", "enum",
     "implements", "interface", "package", "private", "protected", "public",
     "arguments", "eval", "isFinite", "isNaN", "parseInt", "parseFloat",
     "encodeURI", "encodeURIComponent", "decodeURI", "decodeURIComponent",
     "Math", "Number", "String", "Boolean", "Object", "Array", "Date",
     "RegExp", "Map", "Set", "WeakMap", "WeakSet", "Symbol", "BigInt",
     "JSON", "Promise", "Reflect", "Proxy", "Intl", "Error", "TypeError",
     "ReferenceError", "SyntaxError", "RangeError", "URIError",
     "navigator", "location", "history", "localStorage", "sessionStorage",
     "setTimeout", "setInterval", "clearTimeout", "clearInterval",
     "fetch", "XMLHttpRequest", "WebSocket", "Event", "addEventListener", "removeEventListener",
     "Node", "Element", "HTMLElement", "querySelector", "querySelectorAll",
     "innerHTML", "innerText", "textContent", "appendChild", "removeChild",
     "createElement", "getElementById", "getElementsByClassName", "getElementsByTagName",
     "canvas", "getContext", "drawImage", "fillRect", "strokeRect", "beginPath", "moveTo",
     "lineTo", "arc", "fill", "stroke"
 ];


    const userCode = editor.getValue();
    const userDefined = userCode.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || [];
    const uniqueSuggestions = [...new Set([...jsKeywords, ...userDefined])];

    const suggestions = uniqueSuggestions.filter(keyword =>
        keyword.startsWith(currentWord)
    );

    return {
        list: suggestions,
        from: CodeMirror.Pos(cursor.line, token.start),
        to: CodeMirror.Pos(cursor.line, token.end),
    };
}

editor.on("inputRead", function (editor, event) {
    if (!event.text[0].match(/[a-zA-Z_$]/)) return;
    CodeMirror.showHint(editor, customJavaScriptHint, { completeSingle: false });
});


    // Function to manage output limits
    function createConsoleMethod(type) {
        return (message) => {
            const currentOutput = outputContainer.textContent;
            const currentLines = currentOutput.split('\n').length;
            const currentChars = currentOutput.length;

            if (currentLines > MAX_LINES || currentChars > MAX_CHARS) {
                const errorEntry = document.createElement('div');
                errorEntry.className = 'console-error-entry';
                errorEntry.textContent = `Error: Output limit exceeded. Execution stopped.`;
                outputContainer.appendChild(errorEntry);
                throw new Error('Output limit exceeded.');
            }

            const entry = document.createElement('div');
            entry.className = `console-${type}-entry`;
            entry.textContent = message;
            outputContainer.appendChild(entry);
        };
    }

    // Run Code Button
    document.getElementById('runButton').addEventListener('click', () => {
        outputContainer.innerHTML = ""; // Clear the output section
        const code = editor.getValue();

        try {
            const sandboxedCode = `
                (function(document, console) {
                    const timeout = setTimeout(() => { throw new Error('Execution time exceeded.'); }, 3000);
                    ${code}
                    clearTimeout(timeout);
                })(sandboxDocument, sandboxDocument.console);
            `;
            eval(sandboxedCode);
        } catch (error) {
            const errorEntry = document.createElement('div');
            errorEntry.className = 'error-entry';
            errorEntry.textContent = `Error: ${error.message}`;
            outputContainer.appendChild(errorEntry);
        }
    });

    // Copy Code Button
    document.getElementById('copyCode').addEventListener('click', () => {
        const code = editor.getValue();
        navigator.clipboard.writeText(code).then(() => {
            alert("Code copied to clipboard!");
        });
    });

    // Save Code Button
    document.getElementById('saveCode').addEventListener('click', () => {
        const code = editor.getValue();
        if (!code.trim()) {
            alert("Cannot save empty code!");
            return;
        }

        let savedCodes = JSON.parse(localStorage.getItem('savedCodes')) || [];
        savedCodes.push(code);
        localStorage.setItem('savedCodes', JSON.stringify(savedCodes));
        alert("Code saved successfully!");
        updateSavedCodeList(savedCodes);
    });

    // Update Saved Code List
    function updateSavedCodeList(savedCodes) {
        const savedCodeList = document.getElementById('savedCodeList');
        savedCodeList.innerHTML = '';

        if (savedCodes.length === 0) {
            savedCodeList.textContent = "No saved code yet.";
            return;
        }

        savedCodes.forEach((code, index) => {
            const codeBlock = document.createElement('div');
            codeBlock.classList.add('saved-code-item');

            const codeContent = document.createElement('pre');
            codeContent.textContent = code;
            codeBlock.appendChild(codeContent);

            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('button-container');

            const copyButton = document.createElement('button');
            copyButton.classList.add('copy-button');
            copyButton.textContent = 'Copy';
            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(code).then(() => {
                    alert('Code copied to clipboard!');
                });
            });

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => {
                savedCodes.splice(index, 1);
                localStorage.setItem('savedCodes', JSON.stringify(savedCodes));
                updateSavedCodeList(savedCodes);
            });

            buttonContainer.appendChild(copyButton);
            buttonContainer.appendChild(deleteButton);
            codeBlock.appendChild(buttonContainer);
            savedCodeList.appendChild(codeBlock);
        });
    }

    const savedCodes = JSON.parse(localStorage.getItem('savedCodes')) || [];
    updateSavedCodeList(savedCodes);

    // Theme Toggle
 function applyTheme(theme) {
    if (theme === 'dark') {
      // Apply dark theme
      document.body.setAttribute('data-theme', 'dark');
      moonIcon.style.display = 'none';
      sunIcon.style.display = 'block';
      editor.setOption('theme', 'dracula');
      savedCodeContainer.setAttribute('data-theme', 'dark');
    } else {
      // Apply light theme
      document.body.removeAttribute('data-theme');
      moonIcon.style.display = 'block';
      sunIcon.style.display = 'none';
      editor.setOption('theme', 'default');
      savedCodeContainer.removeAttribute('data-theme');
    }

    // Persist theme in localStorage
    localStorage.setItem('theme', theme);
  }

  // Load the stored theme when the page loads
  const storedTheme = localStorage.getItem('theme') || 'light'; // Default to 'light' if no theme is stored
  applyTheme(storedTheme);

  // Add event listener for theme toggle
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
});


    // Clear Output and Input Button
const clearButton = document.getElementById('clearCode');
clearButton.addEventListener('click', () => {
    editor.setValue(''); // Clears the content in the CodeMirror editor
    outputContainer.innerHTML = ""; // Clears the output container

});

});
