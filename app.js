const passwordInput = document.getElementById('passwordInput');
const progressBar = document.getElementById('progressBar');
const strengthText = document.getElementById('strengthText');
const togglePassword = document.getElementById('togglePassword');
const entropyScore = document.getElementById('entropyScore');
const crackTime = document.getElementById('crackTime');
const patternWarning = document.getElementById('patternWarning');
const generateBtn = document.getElementById('generatePassword');
const copyBtn = document.getElementById('copyPassword');
const passwordHistory = document.getElementById('passwordHistory');

const criteria = {
    length: document.getElementById('length'),
    uppercase: document.getElementById('uppercase'),
    lowercase: document.getElementById('lowercase'),
    number: document.getElementById('number'),
    special: document.getElementById('special')
};


const commonPatterns = [
    /^123\d*$/,
    /^password\d*$/i,
    /^qwerty\d*$/i,
    /^admin\d*$/i,
    /(\w)\1{2,}/  
];

const strengthEmojis = {
    'Very Weak': '😱',
    'Weak': '😟',
    'Fair': '😐',
    'Good': '😊',
    'Strong': '😎',
    'Very Strong': '🦾'
};

const passwordSuggestions = {
    length: 'Make it longer (at least 12 characters)',
    uppercase: 'Add uppercase letters (A-Z)',
    lowercase: 'Add lowercase letters (a-z)',
    numbers: 'Add numbers (0-9)',
    special: 'Add special characters (!@#$%^&*)',
    patterns: 'Avoid common patterns and sequences'
};


document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.documentElement.setAttribute('data-theme', btn.dataset.theme);
        localStorage.setItem('preferred-theme', btn.dataset.theme);
        
        // Animate the container
        const container = document.querySelector('.container');
        container.classList.add('pulse');
        setTimeout(() => container.classList.remove('pulse'), 500);
    });
});


const savedTheme = localStorage.getItem('preferred-theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);


const calculateEntropy = (password) => {
    let charset = 0;
    charset += /[a-z]/.test(password) ? 26 : 0;
    charset += /[A-Z]/.test(password) ? 26 : 0;
    charset += /[0-9]/.test(password) ? 10 : 0;
    charset += /[^A-Za-z0-9]/.test(password) ? 33 : 0;
    
    const entropy = Math.log2(Math.pow(charset, password.length));
    return Math.round(entropy);
};


const estimateCrackTime = (entropy) => {
    const guessesPerSecond = 1000000000; 
    const seconds = Math.pow(2, entropy) / guessesPerSecond;
    
    if (seconds < 60) return 'Instant';
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
    return `${Math.round(seconds / 31536000)} years`;
};


const generateStrongPassword = () => {
    // Simplified button state
    generateBtn.textContent = 'Generating...';
    generateBtn.disabled = true;
    
    setTimeout(() => {
        const length = parseInt(document.getElementById('passwordLength').value);
        const uppercase = document.getElementById('includeUppercase').checked;
        const lowercase = document.getElementById('includeLowercase').checked;
        const numbers = document.getElementById('includeNumbers').checked;
        const symbols = document.getElementById('includeSymbols').checked;

        let chars = '';
        if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (numbers) chars += '0123456789';
        if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (!chars) {
            alert('Please select at least one character type');
            return;
        }

        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        passwordInput.value = password;
        checkPassword(password);
        
        // Restore button
        generateBtn.textContent = 'Generate Strong Password';
        generateBtn.disabled = false;
    }, 200); // Reduced timeout for faster response
};


const getStrengthLevel = (validCriteria) => {
    if (validCriteria <= 1) return 'Very Weak';
    if (validCriteria === 2) return 'Weak';
    if (validCriteria === 3) return 'Fair';
    if (validCriteria === 4) return 'Good';
    return 'Very Strong';
};

const checkPassword = (password) => {
    
    Object.keys(criteria).forEach(key => {
        criteria[key].classList.remove('valid');
    });

    if (!password) {
        
        progressBar.className = 'progress';
        strengthText.querySelector('span').textContent = 'Start typing...';
        document.getElementById('strengthEmoji').textContent = '';
        entropyScore.textContent = '0 bits';
        crackTime.textContent = '-';
        document.getElementById('suggestions').innerHTML = '';
        return;
    }

    // Check each criterion with minimal animation
    Object.keys(criteria).forEach(key => {
        let isValid = false;
        if (key === 'length') isValid = password.length >= 8;
        else if (key === 'uppercase') isValid = /[A-Z]/.test(password);
        else if (key === 'lowercase') isValid = /[a-z]/.test(password);
        else if (key === 'number') isValid = /[0-9]/.test(password);
        else if (key === 'special') isValid = /[^A-Za-z0-9]/.test(password);
        
        if (isValid) {
            criteria[key].classList.add('valid');
        }
    });

    const validCriteria = Object.keys(criteria)
        .filter(key => criteria[key].classList.contains('valid')).length;

    // Update UI with minimal animations
    const strengthLevel = getStrengthLevel(validCriteria);
    updateStrength(validCriteria, password.length);
    
    document.getElementById('strengthEmoji').textContent = strengthEmojis[strengthLevel];

    // Update analysis with minimal animations
    const entropy = calculateEntropy(password);
    entropyScore.textContent = `${entropy} bits`;
    crackTime.textContent = estimateCrackTime(entropy);

    updateSuggestions(password);
    trackPasswordExpiration(password);

    if (checkDictionary(password)) {
        document.getElementById('suggestions').innerHTML += `
            <div class="suggestion-item warning">
                ⚠️ This password is similar to commonly used passwords
            </div>
        `;
    }
    
    // Only update charts occasionally to improve performance
    // Use a debounce technique to prevent excessive chart updates
    clearTimeout(window.chartUpdateTimeout);
    window.chartUpdateTimeout = setTimeout(() => {
        updateComplexityChart(password);
        updateStrengthHistory(password);
    }, 500);
};

const updateStrength = (validCriteria, length) => {
    let strength = '';
    progressBar.className = 'progress';

    if (length === 0) {
        strength = 'Start typing...';
    } else if (validCriteria <= 1) {
        strength = 'Weak';
        progressBar.classList.add('weak');
    } else if (validCriteria === 2) {
        strength = 'Fair';
        progressBar.classList.add('fair');
    } else if (validCriteria === 3) {
        strength = 'Good';
        progressBar.classList.add('good');
    } else if (validCriteria === 4) {
        strength = 'Strong';
        progressBar.classList.add('strong');
    } else {
        strength = 'Very Strong';
        progressBar.classList.add('very-strong');
    }

    strengthText.querySelector('span').textContent = strength;
};

const savePasswordToHistory = (password) => {
    const passwords = JSON.parse(localStorage.getItem('passwordHistory') || '[]');
    passwords.unshift({ 
        password: password,
        date: new Date().toLocaleDateString()
    });
    localStorage.setItem('passwordHistory', JSON.stringify(passwords.slice(0, 5)));
    updatePasswordHistory();
};

const updatePasswordHistory = () => {
    const passwords = JSON.parse(localStorage.getItem('passwordHistory') || '[]');
    passwordHistory.innerHTML = passwords
        .map(entry => `<li>
            <span>${'*'.repeat(entry.password.length)}</span>
            <span>${entry.date}</span>
        </li>`)
        .join('');
};

<<<<<<< HEAD
// Enhanced updateSuggestions function with animations
=======
>>>>>>> 1a57dabc7b7baa9a1eec6c640045735433ea5574
const updateSuggestions = (password) => {
    const suggestions = [];
    const add = (condition, message) => condition && suggestions.push(message);

    add(password.length < 12, passwordSuggestions.length);
    add(!/[A-Z]/.test(password), passwordSuggestions.uppercase);
    add(!/[a-z]/.test(password), passwordSuggestions.lowercase);
    add(!/[0-9]/.test(password), passwordSuggestions.numbers);
    add(!/[^A-Za-z0-9]/.test(password), passwordSuggestions.special);
    add(/(\w)\1{2,}/.test(password), 'Avoid repeating characters');
    
    const suggestionsHtml = suggestions.length ? suggestions
        .map((suggestion) => `
            <div class="suggestion-item" role="button" tabindex="0">
                <span>💡</span> ${suggestion}
            </div>
        `).join('') : '<p>Your password meets all criteria! 🎉</p>';
    
    document.getElementById('suggestions').innerHTML = suggestionsHtml;
};


const trackPasswordExpiration = (password) => {
    if (password && password.length >= 8) {
        const currentDate = new Date();
        const lastChangeDate = currentDate.toLocaleDateString();
        const expirationDate = new Date(currentDate);
        expirationDate.setMonth(expirationDate.getMonth() + 3);
        
        localStorage.setItem('passwordExpiration', expirationDate.toISOString());
        localStorage.setItem('currentPassword', password);
        localStorage.setItem('passwordLastChanged', lastChangeDate);
        updateExpirationStatus();
    }
};

const updateExpirationStatus = () => {
    const expirationDate = new Date(localStorage.getItem('passwordExpiration') || new Date());
    const lastChanged = localStorage.getItem('passwordLastChanged') || 'Never';
    const today = new Date();
    const daysLeft = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
    
    const statusElement = document.getElementById('expirationStatus');
    let statusHtml = `<div>Last changed: ${lastChanged}</div>`;
    
    if (daysLeft <= 0) {
        statusHtml += `
            <div class="expiration-warning">
                ⚠️ Password expired ${Math.abs(daysLeft)} days ago!
                <br>Please update your password for security.
            </div>
        `;
    } else if (daysLeft <= 7) {
        statusHtml += `
            <div class="expiration-warning">
                ⚠️ Password expires in ${daysLeft} days!
                <br>Consider renewing your password soon.
            </div>
        `;
    } else {
        statusHtml += `
            <div>
                ✅ Password valid for ${daysLeft} days
                <br>Next renewal recommended on ${expirationDate.toLocaleDateString()}
            </div>
        `;
    }
    
    statusElement.innerHTML = statusHtml;
};


const commonPasswords = [
    'password', '123456', 'qwerty', 'admin', 'welcome',
    
];

const checkDictionary = (password) => {
    const normalized = password.toLowerCase();
    return commonPasswords.some(common => 
        normalized.includes(common) || 
        common.includes(normalized)
    );
};


const generatePassword = () => {
    const length = parseInt(document.getElementById('passwordLength').value);
    const uppercase = document.getElementById('includeUppercase').checked;
    const lowercase = document.getElementById('includeLowercase').checked;
    const numbers = document.getElementById('includeNumbers').checked;
    const symbols = document.getElementById('includeSymbols').checked;

    let chars = '';
    if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (numbers) chars += '0123456789';
    if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) return ''; 

    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};


let complexityChart = null;
let strengthHistoryChart = null;


const updateStrengthHistory = (password) => {
    const history = JSON.parse(localStorage.getItem('strengthHistory') || '[]');
    const strength = {
        timestamp: new Date().toISOString(),
        score: calculateStrengthScore(password),
        length: password.length
    };
    
    history.push(strength);
    if (history.length > 10) history.shift(); 
    localStorage.setItem('strengthHistory', JSON.stringify(history));
    
    updateStrengthHistoryChart(history);
};

const calculateStrengthScore = (password) => {
    if (!password) return 0;
    const entropy = calculateEntropy(password);
    const variety = (/[A-Z]/.test(password) + /[a-z]/.test(password) + 
                    /[0-9]/.test(password) + /[^A-Za-z0-9]/.test(password));
    const uniqueness = new Set(password).size / password.length;
    
    return Math.min(100, (entropy/50 + variety*25 + uniqueness*25));
};

// Enhance strength history chart with animations
const updateStrengthHistoryChart = (history) => {
    const ctx = document.getElementById('strengthHistoryChart').getContext('2d');
    
    if (strengthHistoryChart) {
        strengthHistoryChart.destroy();
    }

    // Simplified animation wrapper
    const wrapper = document.querySelector('.strength-history-wrapper');
    wrapper.classList.add('fade-in');

    strengthHistoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.map(h => new Date(h.timestamp).toLocaleTimeString()),
            datasets: [{
                label: 'Strength Score',
                data: history.map(h => h.score),
                borderColor: 'rgba(46, 204, 113, 1)',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            // Reduce animation duration for better performance
            animation: {
                duration: 500
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'var(--text-secondary)',
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'var(--text-secondary)',
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'var(--text-primary)',
                        font: {
                            size: 12
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Password Strength Over Time',
                    color: 'var(--text-primary)',
                    font: {
                        size: 14
                    }
                }
            }
        }
    });
};


const updateComplexityChart = (password) => {
    const ctx = document.getElementById('complexityChart').getContext('2d');
    const scores = {
        length: Math.min(password.length / 16, 1) * 100,
        variety: ((/[A-Z]/.test(password) + /[a-z]/.test(password) + 
                  /[0-9]/.test(password) + /[^A-Za-z0-9]/.test(password)) / 4) * 100,
        entropy: (calculateEntropy(password) / 100) * 100,
        uniqueness: (new Set(password).size / password.length) * 100 || 0
    };

    // Remove fade-in animation
    if (complexityChart) {
        complexityChart.destroy();
    }

    complexityChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Length', 'Character Variety', 'Entropy', 'Uniqueness'],
            datasets: [{
                label: 'Password Strength',
                data: Object.values(scores),
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                borderColor: 'rgba(46, 204, 113, 1)',
                pointBackgroundColor: 'rgba(46, 204, 113, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(46, 204, 113, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            // Reduce animation duration for better performance
            animation: {
                duration: 300
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        color: 'var(--text-secondary)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    pointLabels: {
                        color: 'var(--text-primary)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'var(--text-primary)'
                    }
                }
            }
        }
    });

    // Simplify the details section animation
    const details = document.getElementById('complexityDetails');
    details.innerHTML = `
        <div class="complexity-scores">
            <p>Length: ${scores.length.toFixed(1)}%</p>
            <p>Variety: ${scores.variety.toFixed(1)}%</p>
            <p>Entropy: ${scores.entropy.toFixed(1)}%</p>
            <p>Uniqueness: ${scores.uniqueness.toFixed(1)}%</p>
        </div>
    `;
};


const exportData = () => {
    const data = {
        passwordHistory: JSON.parse(localStorage.getItem('passwordHistory') || '[]'),
        settings: {
            theme: localStorage.getItem('preferred-theme'),
            generatorOptions: {
                length: document.getElementById('passwordLength').value,
                uppercase: document.getElementById('includeUppercase').checked,
                lowercase: document.getElementById('includeLowercase').checked,
                numbers: document.getElementById('includeNumbers').checked,
                symbols: document.getElementById('includeSymbols').checked
            }
        }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'password-checker-data.json';
    a.click();
};

const importData = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            localStorage.setItem('passwordHistory', JSON.stringify(data.passwordHistory));
            localStorage.setItem('preferred-theme', data.settings.theme);
            updatePasswordHistory();
            document.documentElement.setAttribute('data-theme', data.settings.theme);
        } catch (err) {
            alert('Invalid data file');
        }
    };
    reader.readAsText(file);
};


document.getElementById('exportData').addEventListener('click', exportData);
document.getElementById('importFile').addEventListener('change', (e) => {
    if (e.target.files[0]) importData(e.target.files[0]);
});
document.getElementById('importData').addEventListener('click', () => {
    document.getElementById('importFile').click();
});


document.getElementById('passwordLength').addEventListener('input', (e) => {
    document.getElementById('lengthValue').textContent = e.target.value;
});


passwordInput.addEventListener('input', (e) => {
    // Remove the floating letter effect completely
    checkPassword(e.target.value);
});

togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePassword.textContent = type === 'password' ? '👁️' : '🔒';
});

generateBtn.addEventListener('click', generateStrongPassword);

// Enhance copy button with animation
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(passwordInput.value)
        .then(() => {
            copyBtn.textContent = '✓ Copied!';
            showFeedback('Password copied to clipboard!');
            
            setTimeout(() => {
                copyBtn.textContent = 'Copy Password';
            }, 1500);
        });
});

const saveBtn = document.createElement('button');
saveBtn.id = 'savePassword';
saveBtn.className = 'btn';
saveBtn.textContent = 'Save Password';
document.querySelector('.button-group').appendChild(saveBtn);

// Enhanced save button with animation
saveBtn.addEventListener('click', () => {
    const password = passwordInput.value;
    if (password) {
        saveBtn.textContent = '✓ Saved!';
        
        savePasswordToHistory(password);
        showFeedback('Password saved to history!');
        
        setTimeout(() => {
            saveBtn.textContent = 'Save Password';
        }, 1500);
    }
});

document.getElementById('suggestions').addEventListener('click', (e) => {
    const suggestionItem = e.target.closest('.suggestion-item');
    if (!suggestionItem) return;

    const currentPassword = passwordInput.value;
    const suggestionText = suggestionItem.textContent;

    let improvement = '';
    if (suggestionText.includes('longer')) {
        improvement = generateStrongPassword().slice(0, 4);
    } else if (suggestionText.includes('uppercase')) {
        improvement = 'ABC';
    } else if (suggestionText.includes('numbers')) {
        improvement = '123';
    } else if (suggestionText.includes('special')) {
        improvement = '@#$';
    }

    passwordInput.value = currentPassword + improvement;
    checkPassword(passwordInput.value);
});

document.getElementById('renewPassword').addEventListener('click', () => {
    const currentPassword = passwordInput.value;
    
    if (!currentPassword) {
        alert('Please enter a password first');
        return;
    }

    if (confirm(`Do you want to generate a new password?\n\nCurrent password will be saved to history.`)) {
        savePasswordToHistory(currentPassword);
        
        const newPassword = generateStrongPassword();
        passwordInput.value = newPassword;
        checkPassword(newPassword);
        trackPasswordExpiration(newPassword);
        
        alert('New password generated and expiration timer reset!');
    }
});

document.getElementById('renewPassword').addEventListener('click', () => {
    const currentPassword = localStorage.getItem('currentPassword');
    if (currentPassword) {
        const newPassword = generateStrongPassword();
        passwordInput.value = newPassword;
        checkPassword(newPassword);
        trackPasswordExpiration(newPassword);
    }
});

// Enhanced UI Feedback Function
const showFeedback = (message, type = 'success') => {
    // Remove any existing feedback
    const existingFeedback = document.querySelector('.copy-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    // Create and show new feedback
    const feedback = document.createElement('div');
    feedback.className = `copy-feedback ${type}`;
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    // Remove after shorter time
    setTimeout(() => {
        feedback.remove();
    }, 2000);
};

// Optimize DOMContentLoaded event by removing most animations
document.addEventListener('DOMContentLoaded', () => {
    // Initialize with minimal animations
    updatePasswordHistory();
    updateExpirationStatus();
    
    const lastPassword = localStorage.getItem('currentPassword');
    if (lastPassword) {
        passwordInput.value = lastPassword;
        checkPassword(lastPassword);
    }

    // Initialize charts just once at load time
    updateComplexityChart('');
    updateStrengthHistoryChart(JSON.parse(localStorage.getItem('strengthHistory') || '[]'));
});
