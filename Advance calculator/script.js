// script.js

// --- DOM Elements ---
const expressionDisplay = document.getElementById('expression-display');
const resultDisplay = document.getElementById('result-display');
const buttons = document.querySelectorAll('.calc-btn');
const historyList = document.getElementById('history-list');
const mobileHistoryList = document.getElementById('mobile-history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const toggleHistoryBtn = document.getElementById('toggle-history-btn');
const closeHistoryBtn = document.getElementById('close-history-btn');
const mobileHistoryPanel = document.getElementById('mobile-history-panel');
const mobileHistoryOverlay = document.getElementById('mobile-history-overlay');

// --- State Variables ---
let currentExpression = '';
let currentResult = '0';
let isNewInputExpected = true;
let history = JSON.parse(localStorage.getItem('calc-history')) || [];

// --- Initialize ---
function init() {
    updateDisplay();
    renderHistory();
    setupEventListeners();
}

// --- Display Logic ---
function updateDisplay() {
    // Format expression for better readability
    let formattedExpr = currentExpression
        .replace(/\*/g, '×')
        .replace(/\//g, '÷')
        .replace(/-/g, '−')
        .replace(/Math\.PI/g, 'π')
        .replace(/Math\.sin/g, 'sin')
        .replace(/Math\.cos/g, 'cos')
        .replace(/Math\.tan/g, 'tan')
        .replace(/Math\.log10/g, 'log')
        .replace(/Math\.log/g, 'ln')
        .replace(/Math\.sqrt/g, '√');
    
    expressionDisplay.textContent = formattedExpr;
    resultDisplay.value = currentResult;

    // Adjust font size dynamically if result gets too long
    if (currentResult.length > 12) {
        resultDisplay.classList.replace('text-5xl', 'text-4xl');
    } else if (currentResult.length > 18) {
        resultDisplay.classList.replace('text-4xl', 'text-2xl');
    } else {
        resultDisplay.className = "w-full bg-transparent text-right text-5xl font-light text-white outline-none placeholder-gray-600 truncate mb-1";
    }
}

// --- Action Handler ---
function handleAction(action, value) {
    if (action === 'calculate') {
        calculateResult();
        return;
    }

    if (action === 'clear-all') {
        currentExpression = '';
        currentResult = '0';
        isNewInputExpected = true;
        updateDisplay();
        return;
    }

    if (action === 'clear-entry') {
        currentResult = '0';
        isNewInputExpected = true;
        updateDisplay();
        return;
    }

    if (action === 'backspace') {
        if (!isNewInputExpected) {
            currentExpression = currentExpression.slice(0, -1);
            if (currentExpression === '') {
                currentResult = '0';
                isNewInputExpected = true;
            } else {
                 // Try to evaluate the incomplete expression softly
                 try {
                     const tempRes = evaluateExpression(currentExpression);
                     currentResult = formatResult(tempRes);
                 } catch(e) { /* ignore */ }
            }
        }
        updateDisplay();
        return;
    }

    // Entering a number or dot
    if (value !== undefined) {
        if (isNewInputExpected) {
            currentExpression = value === '.' ? '0.' : value;
            isNewInputExpected = false;
        } else {
            // Prevent multiple dots in same number (basic check)
            const parts = currentExpression.split(/[\+\-\*\/\(\)\^]/);
            const lastPart = parts[parts.length - 1];
            if (value === '.' && lastPart.includes('.')) return;
            
            currentExpression += value;
        }
    } else {
        // Operators and Sci Functions
        isNewInputExpected = false;
        
        const operatorMap = {
            'add': '+',
            'subtract': '-',
            'multiply': '*',
            'divide': '/',
            'percent': '%',
            'power': '^',
            'bracket-left': '(',
            'bracket-right': ')'
        };

        const sciFuncMap = {
            'sin': 'Math.sin(',
            'cos': 'Math.cos(',
            'tan': 'Math.tan(',
            'log': 'Math.log10(',
            'ln': 'Math.log(',
            'sqrt': 'Math.sqrt(',
            'pi': 'Math.PI',
        };

        if (operatorMap[action]) {
            currentExpression += operatorMap[action];
        } else if (sciFuncMap[action]) {
            currentExpression += sciFuncMap[action];
        } else if (action === 'square') {
            currentExpression += '^2';
        }
    }

    // Try live update if valid
    try {
         const tempRes = evaluateExpression(currentExpression);
         if(tempRes !== undefined && !isNaN(tempRes) && isFinite(tempRes)) {
             currentResult = formatResult(tempRes);
         }
    } catch(e) {
        // Just fail silently for live updates (e.g., hanging operator like "5+")
    }

    updateDisplay();
}

// --- Evaluator Core ---
function evaluateExpression(expr) {
    if (!expr) return 0;

    // Convert specialized syntax to JS eval friendly string
    let evalStr = expr
        .replace(/Math\.PI/g, Math.PI.toString()) // handle PI value
        .replace(/%/g, '/100'); // % to percentage

    // Handle Power operator (^)
    // Simple replacement A^B -> A**B. For reliable parsing, we replace it with **
    evalStr = evalStr.replace(/\^/g, '**');

    // Add closing parens if missing
    let openParens = (evalStr.match(/\(/g) || []).length;
    let closeParens = (evalStr.match(/\)/g) || []).length;
    while (openParens > closeParens) {
        evalStr += ')';
        closeParens++;
    }

    try {
        // Using Function constructor as a slightly safer alternative to direct eval
        // Still requires trust in the input which is controlled by UI/Keyboard logic
        const func = new Function(`return (${evalStr})`);
        const result = func();
        return result;
    } catch (e) {
        throw new Error('Invalid Expression');
    }
}

function calculateResult() {
    try {
        if (!currentExpression) return;
        
        let originalExpr = currentExpression;
        let finalValue = evaluateExpression(currentExpression);
        
        if (!isFinite(finalValue)) {
            currentResult = 'Error';
        } else {
            currentResult = formatResult(finalValue);
            addHistory(originalExpr, currentResult);
        }
        
        currentExpression = currentResult.toString();
        isNewInputExpected = true;
    } catch (error) {
        currentResult = 'Error';
        isNewInputExpected = true;
    }
    updateDisplay();
}

// Format to avoid ridiculous float trailing like 0.30000000000004
function formatResult(num) {
    if (typeof num !== 'number') return num;
    if (Number.isInteger(num)) return num.toString();
    
    // Round to 8 decimal places and strip trailing zeros
    return parseFloat(num.toFixed(8)).toString();
}

// --- History Logic ---
function addHistory(expr, res) {
    // Avoid duplicate immediate repeats
    if (history.length > 0 && history[0].expr === expr) return;

    // formatted display string
    let formattedExpr = expr
        .replace(/\*/g, '×')
        .replace(/\//g, '÷')
        .replace(/-/g, '−')
        .replace(/Math\.PI/g, 'π')
        .replace(/Math\.sin/g, 'sin')
        .replace(/Math\.cos/g, 'cos')
        .replace(/Math\.tan/g, 'tan')
        .replace(/Math\.log10/g, 'log')
        .replace(/Math\.log/g, 'ln')
        .replace(/Math\.sqrt/g, '√');

    history.unshift({ expr: formattedExpr, res });
    // Keep max 20 history items
    if (history.length > 20) history.pop();
    
    localStorage.setItem('calc-history', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const renderTarget = (listElement) => {
        if (history.length === 0) {
            listElement.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full opacity-50 text-sm">
                    <p>No history yet</p>
                </div>`;
            return;
        }

        listElement.innerHTML = history.map((item, idx) => `
            <div class="group flex flex-col items-end p-2 md:p-3 rounded-xl hover:bg-gray-700/50 cursor-pointer transition-colors history-item-anim border border-transparent hover:border-gray-600" style="animation-delay: ${idx * 0.05}s" onclick="recallHistory('${item.res}')">
                <span class="text-sm text-gray-400 font-mono">${item.expr} =</span>
                <span class="text-xl md:text-2xl text-white font-light mt-1">${item.res}</span>
            </div>
        `).join('');
    };

    renderTarget(historyList);
    if(mobileHistoryList) renderTarget(mobileHistoryList);
}

// Expose to global for absolute onclick handling 
window.recallHistory = (val) => {
    currentExpression = val;
    currentResult = val;
    isNewInputExpected = true;
    updateDisplay();
    // if mobile, close sidebar
    closeMobileHistory();
};

function clearHistory() {
    history = [];
    localStorage.removeItem('calc-history');
    renderHistory();
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    // Buttons
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = btn.getAttribute('data-action');
            const value = btn.getAttribute('data-value');
            
            // Visual feedback
            btn.classList.add('key-pressed');
            setTimeout(() => btn.classList.remove('key-pressed'), 200);

            handleAction(action, value);
        });
    });

    // Keyboard support
    document.addEventListener('keydown', handleKeyboard);

    // History controls
    clearHistoryBtn.addEventListener('click', clearHistory);
    
    // Mobile controls
    toggleHistoryBtn.addEventListener('click', openMobileHistory);
    closeHistoryBtn.addEventListener('click', closeMobileHistory);
    mobileHistoryOverlay.addEventListener('click', closeMobileHistory);
}

function openMobileHistory() {
    mobileHistoryOverlay.classList.remove('hidden');
    // small delay to allow display to render before transitions
    setTimeout(() => {
        mobileHistoryOverlay.classList.replace('opacity-0', 'opacity-100');
        mobileHistoryPanel.classList.remove('translate-y-full');
    }, 10);
}

function closeMobileHistory() {
    mobileHistoryOverlay.classList.replace('opacity-100', 'opacity-0');
    mobileHistoryPanel.classList.add('translate-y-full');
    setTimeout(() => {
        mobileHistoryOverlay.classList.add('hidden');
    }, 300);
}

function handleKeyboard(e) {
    const key = e.key;

    // Ignore if holding modifier keys (except shift for +, *, (, etc)
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    // Numbers & Decimal
    if (/^[0-9\.]$/.test(key)) {
        triggerButtonPress(`[data-value="${key}"]`);
        handleAction(null, key);
        e.preventDefault();
    }
    
    // Operators map
    const opMap = {
        '+': 'add',
        '-': 'subtract',
        '*': 'multiply',
        '/': 'divide',
        '%': 'percent',
        '^': 'power',
        '(': 'bracket-left',
        ')': 'bracket-right',
        'Enter': 'calculate',
        '=': 'calculate',
        'Backspace': 'backspace',
        'Escape': 'clear-all'
    };

    if (opMap[key]) {
        triggerButtonPress(`[data-action="${opMap[key]}"]`);
        handleAction(opMap[key]);
        e.preventDefault();
    }
}

function triggerButtonPress(selector) {
    const btn = document.querySelector(selector);
    if (btn) {
        btn.classList.add('key-pressed');
        setTimeout(() => btn.classList.remove('key-pressed'), 150);
    }
}

// Boot up
init();
