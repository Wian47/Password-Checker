/**
 * Performance optimizations for Password Checker app
 */

// Simple debounce function to limit expensive operations
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Apply debouncing to expensive operations
document.addEventListener('DOMContentLoaded', () => {
    // Debounce password input to reduce calculation frequency
    const passwordInput = document.getElementById('passwordInput');
    const originalInputHandler = passwordInput.oninput;
    
    passwordInput.oninput = null;
    passwordInput.addEventListener('input', debounce(e => {
        const password = e.target.value;
        checkPassword(password);
    }, 100)); // Small delay for better performance
    
    // Use passive event listeners for better scroll performance
    const scrollableElements = document.querySelectorAll('.password-history ul');
    scrollableElements.forEach(el => {
        el.addEventListener('scroll', () => {}, { passive: true });
    });
    
    // Reduce chart animation frames
    Chart.defaults.animation.duration = 300;
    
    // Preload the emoji to prevent layout shifts
    const emojiPreload = document.createElement('div');
    emojiPreload.style.position = 'absolute';
    emojiPreload.style.visibility = 'hidden';
    emojiPreload.textContent = '😱😟😐😊😎🦾';
    document.body.appendChild(emojiPreload);
    
    // Use requestAnimationFrame for smoother UI updates
    window.requestAnimationFrame = window.requestAnimationFrame || function(callback) {
        return window.setTimeout(callback, 1000/60);
    };
});

// Throttle window resize events
window.addEventListener('resize', debounce(() => {
    if (complexityChart) complexityChart.resize();
    if (strengthHistoryChart) strengthHistoryChart.resize();
}, 250));
