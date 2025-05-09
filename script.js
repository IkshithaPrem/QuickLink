document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const shortenBtn = document.getElementById('shortenBtn');
    const originalUrlInput = document.getElementById('originalUrl');
    const resultDiv = document.getElementById('result');
    const shortUrlSpan = document.getElementById('shortUrl');
    const copyBtn = document.getElementById('copyBtn');
    const urlListDiv = document.getElementById('urlList');

    // Initialize the app
    initApp();

    function initApp() {
        loadUrls();
        setupEventListeners();
        handleInitialRedirect();
    }

    function setupEventListeners() {
        shortenBtn.addEventListener('click', shortenUrl);
        copyBtn.addEventListener('click', copyToClipboard);
        window.addEventListener('hashchange', handleHashChange);
    }

    function handleInitialRedirect() {
        // Check for redirect on initial page load
        if (window.location.hash) {
            processHashRedirect();
        }
    }

    function handleHashChange() {
        if (window.location.hash) {
            processHashRedirect();
        }
    }

    // Main URL shortening function
    function shortenUrl() {
        const originalUrl = originalUrlInput.value.trim();
        
        if (!isValidUrl(originalUrl)) {
            showError('Please enter a valid URL (e.g., example.com or https://example.com)');
            return;
        }
        
        const processedUrl = normalizeUrl(originalUrl);
        const shortCode = generateShortCode();
        const shortUrl = generateShortUrl(shortCode);
        
        if (saveUrl(processedUrl, shortCode)) {
            displayResult(shortUrl);
            originalUrlInput.value = '';
            loadUrls();
        } else {
            showError('This URL has already been shortened');
        }
    }

    // Helper functions
    function isValidUrl(url) {
        try {
            if (!url) return false;
            // Basic check for URL pattern
            return /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\- .\/?%&=]*)?$/.test(url);
        } catch {
            return false;
        }
    }

    function normalizeUrl(url) {
        // Add https:// if not present
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return 'https://' + url;
        }
        return url;
    }

    function generateShortCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({length: 6}, () => 
            chars.charAt(Math.floor(Math.random() * chars.length))
        ).join('');
    }

    function generateShortUrl(shortCode) {
        return `${window.location.origin}/#${shortCode}`;
    }

    // Storage functions
    function saveUrl(originalUrl, shortCode) {
        let urls = getStoredUrls();
        
        // Check for existing URL
        if (urls.some(url => url.original === originalUrl)) {
            return false;
        }
        
        urls.push({
            original: originalUrl,
            shortCode: shortCode,
            visits: 0,
            createdAt: new Date().toISOString()
        });
        
        localStorage.setItem('shortenedUrls', JSON.stringify(urls));
        return true;
    }

    function getStoredUrls() {
        return JSON.parse(localStorage.getItem('shortenedUrls') || '[]');
    }

    // UI functions
    function displayResult(shortUrl) {
        shortUrlSpan.textContent = shortUrl;
        resultDiv.style.display = 'block';
    }

    function showError(message) {
        alert(message); // In a real app you might want prettier error display
    }

    function copyToClipboard() {
        const urlToCopy = shortUrlSpan.textContent;
        navigator.clipboard.writeText(urlToCopy)
            .then(() => {
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy:', err);
            });
    }

    function loadUrls() {
        const urls = getStoredUrls();
        
        if (urls.length === 0) {
            urlListDiv.innerHTML = '<h2>Your Shortened URLs</h2><p>No URLs yet. Shorten one above!</p>';
            return;
        }
        
        let html = '<h2>Your Shortened URLs</h2>';
        
        urls.forEach(url => {
            const fullShortUrl = generateShortUrl(url.shortCode);
            const displayUrl = url.original.length > 50 
                ? url.original.substring(0, 47) + '...' 
                : url.original;
            
            html += `
                <div class="url-item">
                    <div>
                        <a href="${fullShortUrl}" target="_blank" class="short-link">${fullShortUrl}</a><br>
                        <small title="${url.original}">${displayUrl}</small>
                    </div>
                    <div>
                        <span class="visit-count">${url.visits} visits</span>
                        <button class="copy-btn" data-url="${fullShortUrl}">Copy</button>
                    </div>
                </div>
            `;
        });
        
        urlListDiv.innerHTML = html;
        
        // Add event listeners to all copy buttons
        document.querySelectorAll('.copy-btn[data-url]').forEach(btn => {
            btn.addEventListener('click', function() {
                const urlToCopy = this.getAttribute('data-url');
                navigator.clipboard.writeText(urlToCopy)
                    .then(() => {
                        this.textContent = 'Copied!';
                        setTimeout(() => {
                            this.textContent = 'Copy';
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Failed to copy:', err);
                    });
            });
        });
    }

    // Redirect handling
    function processHashRedirect() {
        const shortCode = window.location.hash.substring(1);
        
        if (shortCode.length !== 6) {
            showNotFoundError();
            return;
        }
        
        const urls = getStoredUrls();
        const urlData = urls.find(url => url.shortCode === shortCode);
        
        if (urlData) {
            updateVisitCount(urlData, urls);
            performRedirect(urlData.original);
        } else {
            showNotFoundError();
        }
    }

    function updateVisitCount(urlData, allUrls) {
        urlData.visits += 1;
        localStorage.setItem('shortenedUrls', JSON.stringify(allUrls));
    }

    function performRedirect(url) {
        // Small delay to allow UI to update if needed
        setTimeout(() => {
            window.location.href = url;
        }, 100);
    }

    function showNotFoundError() {
        const container = document.querySelector('.container');
        if (!container.querySelector('.error-message')) {
            const errorHTML = `
                <div class="error-message">
                    <h2>Link Not Found</h2>
                    <p>The short URL <code>${window.location.href}</code> doesn't exist in this browser.</p>
                    <p>Note: Short links are only available in the browser where they were created.</p>
                    <p><a href="${window.location.pathname}">Back to home</a></p>
                </div>
            `;
            container.insertAdjacentHTML('afterbegin', errorHTML);
        }
    }
});