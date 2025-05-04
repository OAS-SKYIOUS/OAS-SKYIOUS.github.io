// Theme Toggling
const htmlElement = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function updateThemeIcon() {
    if (htmlElement.classList.contains('dark-theme')) {
        themeIcon.classList.remove('bi-moon-fill');
        themeIcon.classList.add('bi-sun-fill');
    } else {
        themeIcon.classList.remove('bi-sun-fill');
        themeIcon.classList.add('bi-moon-fill');
    }
}

themeToggle.addEventListener('click', () => {
    htmlElement.classList.toggle('dark-theme');
    localStorage.setItem('theme', htmlElement.classList.contains('dark-theme') ? 'dark' : 'light');
    updateThemeIcon();
});

// Initialize theme icon on load (initial theme set inline in HTML head)
updateThemeIcon();

// Config Generator
const form = document.getElementById('config-form');
const yamlPreview = document.getElementById('yaml-preview');
const copyButton = document.getElementById('copy-yaml');

function generateYAML() {
    const fields = {
        name: document.getElementById('name')?.value,
        author: document.getElementById('author')?.value,
        version: document.getElementById('version')?.value,
        description: document.getElementById('description')?.value,
        logo_url: document.getElementById('logo_url')?.value,
        download_url: document.getElementById('download_url')?.value,
        takedown: document.getElementById('takedown')?.value,
        sha256sum: document.getElementById('sha256sum')?.value,
        homepage: document.getElementById('homepage')?.value,
        tags: document.getElementById('tags')?.value
    };

    // Validate required fields
    const requiredFields = ['name', 'author', 'version', 'description', 'logo_url', 'download_url'];
    const missingFields = requiredFields.filter(field => !fields[field]);
    
    if (missingFields.length > 0) {
        const message = `Missing required fields: ${missingFields.join(', ')}`;
        if (yamlPreview) {
            yamlPreview.textContent = message;
            yamlPreview.style.color = 'var(--secondary-color)';
        }
        return;
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+$/.test(fields.version)) {
        if (yamlPreview) {
            yamlPreview.textContent = 'Invalid version format. Use X.Y.Z format (e.g., 1.0.0)';
            yamlPreview.style.color = 'var(--secondary-color)';
        }
        return;
    }

    // Validate URLs
    const urlFields = ['logo_url', 'download_url', 'homepage'];
    for (const field of urlFields) {
        if (fields[field] && !/^https?:\/\/.+/.test(fields[field])) {
            if (yamlPreview) {
                yamlPreview.textContent = `Invalid ${field} URL format. Must start with http:// or https://`;
                yamlPreview.style.color = 'var(--secondary-color)';
            }
            return;
        }
    }

    let yaml = '';
    for (const [key, value] of Object.entries(fields)) {
        if (value && key !== 'tags') {
            yaml += `${key}: "${value}"\n`;
        }
    }
    if (fields.tags) {
        const tagsArray = fields.tags.split(',').map(t => t.trim()).filter(t => t);
        if (tagsArray.length > 0) {
            yaml += `tags: [${tagsArray.map(t => `"${t}"`).join(', ')}]\n`;
        }
    }

    if (yamlPreview) {
        yamlPreview.textContent = yaml || 'Fill in the form to see your config';
        yamlPreview.style.color = ''; // Reset color
    }
}

if (form) {
    form.addEventListener('input', generateYAML);
}

if (copyButton) {
    copyButton.addEventListener('click', () => {
        if (yamlPreview?.textContent && navigator.clipboard) {
            navigator.clipboard.writeText(yamlPreview.textContent)
                .then(() => {
                    copyButton.textContent = 'Copied!';
                    setTimeout(() => copyButton.textContent = 'Copy Config', 2000);
                })
                .catch(err => console.error('Failed to copy: ', err));
        }
    });
}

// Back to Top Button
const backToTop = document.getElementById('back-to-top');
if (backToTop) {
    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('d-none', window.scrollY <= 300);
    });
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Smooth Scrolling for Anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Fetch GitHub Stats
async function fetchStats() {
    const statsAppsEl = document.getElementById('stats-apps');
    const statsContributorsEl = document.getElementById('stats-contributors');
    if (statsAppsEl) statsAppsEl.textContent = 'Loading...';
    if (statsContributorsEl) statsContributorsEl.textContent = 'Loading...';
    
    try {
        const response = await fetch('https://api.github.com/repos/skyious/index-repo-oneappstore');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (statsAppsEl) statsAppsEl.textContent = data.forks_count ?? 'many';
        if (statsContributorsEl) statsContributorsEl.textContent = data.watchers_count ?? 'numerous';
    } catch (error) {
        console.error("Failed to fetch GitHub stats:", error);
        if (statsAppsEl) statsAppsEl.textContent = 'Failed to load stats';
        if (statsContributorsEl) statsContributorsEl.textContent = 'Failed to load stats';
    }
}
fetchStats();

// Calculate and Display Next Indexing Time
function displayIndexingTime() {
    const localTimeEl = document.getElementById('local-time');
    const utcTimeEl = document.getElementById('utc-time');
    if (!localTimeEl || !utcTimeEl) return;

    localTimeEl.textContent = 'Calculating next indexing time...';
    utcTimeEl.textContent = '';

    const now = new Date();
    // Set target time to 8 PM IST which is 14:30 UTC
    let nextIndexing = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 14, 30, 0));

    // If current time is past today's 14:30 UTC, set target to tomorrow's 14:30 UTC
    if (now.getTime() > nextIndexing.getTime()) {
        nextIndexing.setUTCDate(nextIndexing.getUTCDate() + 1);
    }

    try {
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const localTime = nextIndexing.toLocaleTimeString('en-US', {
            timeZone: userTimeZone,
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
        const utcTime = nextIndexing.toLocaleTimeString('en-US', {
            timeZone: 'UTC',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false // UTC often shown in 24hr format
        });
        localTimeEl.textContent = `Next indexing at ${localTime} (local time)`;
        utcTimeEl.textContent = `and ${utcTime} UTC`;
    } catch (error) {
        console.error("Error formatting date/time:", error);
        localTimeEl.textContent = `Next indexing at 14:30 UTC`;
        utcTimeEl.textContent = ``; // Hide the second line on error
    }
}
displayIndexingTime();

// Fork Now & Explore Store Button Functionality
const forkButton = document.getElementById('fork-button');
const exploreButton = document.getElementById('explore-button');

if (forkButton) {
    forkButton.addEventListener('click', () => {
        window.location.href = 'https://github.com/ONE-APP-STORE/config-repo/fork';
    });
}

if (exploreButton) {
    exploreButton.addEventListener('click', () => {
        window.location.href = 'https://one-app-store.com';
    });
} 
