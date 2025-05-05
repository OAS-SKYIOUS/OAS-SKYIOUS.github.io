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

// ... (Keep your existing Theme Toggling, Config Generator, Back to Top, Smooth Scrolling code above this) ...

// Fetch GitHub Stats and App Count from another repo
async function fetchStatsAndAppCount() {
    // This element will now show the line count from your config file
    const statsAppsEl = document.getElementById('stats-apps');
    // This element will show the stargazers count from the original repo
    const statsContributorsEl = document.getElementById('stats-contributors');

    // Set loading states
    if (statsAppsEl) statsAppsEl.textContent = 'Loading...';
    if (statsContributorsEl) statsContributorsEl.textContent = 'Loading...';

    // --- Fetch stats for your original repo (skyious/config-repo-oneappstore) ---
    // We'll use this to get the stargazers count
    try {
        const originalRepoResponse = await fetch('https://api.github.com/repos/skyious/config-repo-oneappstore');
        if (!originalRepoResponse.ok) {
             console.error(`HTTP error! status: ${originalRepoResponse.status} for original repo`);
             // Optionally update the element to show error or default
             if (statsContributorsEl) statsContributorsEl.textContent = 'Failed to load stats';
        } else {
            const originalRepoData = await originalRepoResponse.json();
            // Display stargazers count (often more relevant than watchers)
            if (statsContributorsEl) statsContributorsEl.textContent = originalRepoData.stargazers_count ?? 'numerous'; // Changed from watchers_count
        }

    } catch (error) {
        console.error("Failed to fetch original repo stats:", error);
        if (statsContributorsEl) statsContributorsEl.textContent = 'Failed to load stats';
    }

    // --- Fetch file content from the NEW repo and count lines for app count ---

    // !!! IMPORTANT: Replace these with the details of your NEW repository !!!
    const NEW_REPO_OWNER = 'skyious'; // e.g., 'ONE-APP-STORE'
    const NEW_REPO_NAME = 'index-repo-oneappstore';   // e.g., 'configs'
    const CONFIG_FILE_PATH = 'apps.one';              // e.g., 'configs/my-app-list/config.one' (if in a subdir)

    try {
        // Use the GitHub Content API to get the file
        const fileContentResponse = await fetch(`https://api.github.com/repos/${NEW_REPO_OWNER}/${NEW_REPO_NAME}/contents/${CONFIG_FILE_PATH}`);

        if (!fileContentResponse.ok) {
             let errorMessage = `HTTP error! status: ${fileContentResponse.status} for config file`;
             if (fileContentResponse.status === 404) {
                 errorMessage = `Config file not found: ${CONFIG_FILE_PATH} in ${NEW_REPO_OWNER}/${NEW_REPO_NAME}`;
             }
             console.error(errorMessage);
             if (statsAppsEl) statsAppsEl.textContent = 'Failed to load count'; // Show error
             return; // Stop here if file fetching failed
        }

        const fileData = await fileContentResponse.json();

        // The file content is base64 encoded in the 'content' field of the response
        if (fileData && fileData.content) {
            const base64Content = fileData.content;
            const decodedContent = atob(base64Content); // Decode the base64 string

            // Count lines: split the content by newline characters.
            // Filter out any empty lines that might result from trailing newlines or blank lines.
            const lines = decodedContent.split('\n').filter(line => line.trim() !== '');

            // Update the statsAppsEl with the number of non-empty lines
            if (statsAppsEl) {
                statsAppsEl.textContent = lines.length;
            }

        } else {
             console.error("Could not retrieve valid file content from API response.");
             if (statsAppsEl) statsAppsEl.textContent = 'Failed to load count'; // Show error
        }

    } catch (error) {
        console.error("Failed to fetch or process config file:", error);
        if (statsAppsEl) statsAppsEl.textContent = 'Failed to load count'; // Show error
    }
}

// Call the new function on load to fetch and display stats and app count
fetchStatsAndAppCount();

// ... (Keep your existing Fork Now & Explore Store Button Functionality below this) ...

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
