// ===== Theme Toggling =====
const htmlElement = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function updateThemeIcon() {
    // Check if elements exist before manipulating them
    if (!htmlElement || !themeIcon) return;

    if (htmlElement.classList.contains('dark-theme')) {
        themeIcon.classList.remove('bi-moon-fill');
        themeIcon.classList.add('bi-sun-fill');
    } else {
        themeIcon.classList.remove('bi-sun-fill');
        themeIcon.classList.add('bi-moon-fill');
    }
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        if (!htmlElement) return;
        htmlElement.classList.toggle('dark-theme');
        // Save theme preference to localStorage
        try {
             localStorage.setItem('theme', htmlElement.classList.contains('dark-theme') ? 'dark' : 'light');
        } catch (e) {
            console.error("LocalStorage is not available:", e);
        }
        updateThemeIcon();
    });
}

// Initialize theme icon on load
// Note: Initial theme (light/dark) should ideally be set based on localStorage
// or system preference *before* this script runs (e.g., inline script in <head>)
// This call ensures the icon matches the initially loaded theme class.
updateThemeIcon();


// ===== Config Generator =====
const form = document.getElementById('config-form');
const yamlPreview = document.getElementById('yaml-preview');
const copyButton = document.getElementById('copy-yaml');

function generateYAML() {
    // Check if essential elements exist
    if (!form || !yamlPreview) return;

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
        yamlPreview.textContent = message;
        yamlPreview.style.color = 'var(--secondary-color)'; // Use CSS variable for color
        return;
    }

    // Validate version format (simple X.Y.Z)
    if (!/^\d+\.\d+\.\d+$/.test(fields.version)) {
        yamlPreview.textContent = 'Invalid version format. Use X.Y.Z format (e.g., 1.0.0)';
        yamlPreview.style.color = 'var(--secondary-color)';
        return;
    }

    // Validate URLs
    const urlFields = ['logo_url', 'download_url', 'homepage'];
    for (const field of urlFields) {
        // Only validate if the field has a value and doesn't look like a basic URL
        if (fields[field] && !/^https?:\/\/.+/.test(fields[field])) {
            yamlPreview.textContent = `Invalid ${field.replace('_', ' ')} URL format. Must start with http:// or https://`;
            yamlPreview.style.color = 'var(--secondary-color)';
            return;
        }
    }

    // Generate YAML string
    let yaml = '';
    for (const [key, value] of Object.entries(fields)) {
        // Only include fields that have a value
        if (value) {
            if (key === 'tags') {
                // Handle tags separately: split, trim, filter empty, format as array
                const tagsArray = value.split(',')
                                     .map(t => t.trim())
                                     .filter(t => t); // Remove empty strings
                if (tagsArray.length > 0) {
                    yaml += `tags: [${tagsArray.map(t => `"${t}"`).join(', ')}]\n`;
                }
            } else {
                // Enclose string values in quotes
                yaml += `${key}: "${value}"\n`;
            }
        }
    }

    yamlPreview.textContent = yaml || 'Fill in the form to see your config';
    yamlPreview.style.color = ''; // Reset color if validation passed
}

// Add event listener to the form for real-time updates
if (form) {
    form.addEventListener('input', generateYAML);
    // Initial call to generate YAML based on any pre-filled form values
    generateYAML();
}

// Add event listener for the copy button
if (copyButton && yamlPreview && navigator.clipboard) {
    copyButton.addEventListener('click', () => {
        const textToCopy = yamlPreview.textContent;
        // Only copy if there's valid text (not placeholder/error) and clipboard API is available
        if (textToCopy && textToCopy !== 'Fill in the form to see your config' && !textToCopy.startsWith('Missing required fields') && !textToCopy.startsWith('Invalid')) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    copyButton.textContent = 'Copied!';
                    // Revert button text after 2 seconds
                    setTimeout(() => { copyButton.textContent = 'Copy Config'; }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy YAML to clipboard: ', err);
                    copyButton.textContent = 'Copy Failed';
                     setTimeout(() => { copyButton.textContent = 'Copy Config'; }, 2000);
                });
        } else {
             copyButton.textContent = 'Nothing to Copy';
             setTimeout(() => { copyButton.textContent = 'Copy Config'; }, 2000);
        }
    });
}


// ===== Back to Top Button =====
const backToTop = document.getElementById('back-to-top');
if (backToTop) {
    window.addEventListener('scroll', () => {
        // Show button if scrolled down more than 300px, hide otherwise
        backToTop.classList.toggle('d-none', window.scrollY <= 300);
    });
    backToTop.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default anchor behavior
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}


// ===== Smooth Scrolling for Anchors =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault(); // Prevent default anchor jump
        const targetId = this.getAttribute('href');
        try {
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } catch (error) {
             console.error(`Error finding or scrolling to element with ID: ${targetId}`, error);
        }
    });
});


// ===== Fetch GitHub Stats and App Count =====
async function fetchStatsAndAppCount() {
    // Element to show app count (lines from config file in the *new* repo)
    const statsAppsEl = document.getElementById('stats-apps');
    // Element to show stargazers (from the *original* repo)
    const statsContributorsEl = document.getElementById('stats-contributors'); // Renamed element ID makes more sense now

    // Set initial loading states
    if (statsAppsEl) statsAppsEl.textContent = 'Loading...';
    if (statsContributorsEl) statsContributorsEl.textContent = 'Loading...';

    // --- Fetch stats for your original repo (for stargazers) ---
    const ORIGINAL_REPO_OWNER = 'skyious';
    const ORIGINAL_REPO_NAME = 'config-repo-oneappstore';
    try {
        const originalRepoResponse = await fetch(`https://api.github.com/repos/${ORIGINAL_REPO_OWNER}/${ORIGINAL_REPO_NAME}`);
        if (!originalRepoResponse.ok) {
            throw new Error(`HTTP error! status: ${originalRepoResponse.status} for original repo`);
        }
        const originalRepoData = await originalRepoResponse.json();
        if (statsContributorsEl) {
            // Display stargazers count, fall back to 'N/A' if undefined/null
            statsContributorsEl.textContent = originalRepoData.stargazers_count ?? 'N/A';
        }
    } catch (error) {
        console.error("Failed to fetch original repo stats:", error);
        if (statsContributorsEl) statsContributorsEl.textContent = 'Error'; // Indicate failure
    }

    // --- Fetch file content from the NEW repo and count lines for app count ---
    const NEW_REPO_OWNER = 'skyious';
    const NEW_REPO_NAME = 'index-repo-oneappstore';
    const CONFIG_FILE_PATH = 'apps.one'; // Path to the file within the new repo
    try {
        // Use the GitHub Content API
        const fileContentResponse = await fetch(`https://api.github.com/repos/${NEW_REPO_OWNER}/${NEW_REPO_NAME}/contents/${CONFIG_FILE_PATH}`);

        if (!fileContentResponse.ok) {
             let errorMessage = `HTTP error! status: ${fileContentResponse.status} for config file`;
             if (fileContentResponse.status === 404) {
                 errorMessage = `Config file not found: ${CONFIG_FILE_PATH} in ${NEW_REPO_OWNER}/${NEW_REPO_NAME}`;
             }
             // Handle rate limiting specifically if possible (status 403 often indicates this)
             if (fileContentResponse.status === 403) {
                errorMessage += ' (Possibly due to GitHub API rate limiting)';
             }
             throw new Error(errorMessage);
        }

        const fileData = await fileContentResponse.json();

        // Check if content exists and decode it
        if (fileData?.content) {
            const base64Content = fileData.content;
            const decodedContent = atob(base64Content); // Decode Base64

            // Count non-empty lines
            const lines = decodedContent.split('\n').filter(line => line.trim() !== '');

            if (statsAppsEl) {
                statsAppsEl.textContent = lines.length; // Display the count
            }
        } else {
            throw new Error("Could not retrieve valid file content from API response.");
        }

    } catch (error) {
        console.error("Failed to fetch or process config file:", error);
        if (statsAppsEl) statsAppsEl.textContent = 'Error'; // Indicate failure
    }
}

// Call the function on page load to fetch and display stats
fetchStatsAndAppCount();


// ===== Calculate and Display Next Indexing Time (Runs every 5 mins UTC) =====
function displayIndexingTime() {
    const localTimeEl = document.getElementById('local-time');
    const utcTimeEl = document.getElementById('utc-time');
    if (!localTimeEl || !utcTimeEl) {
        console.error("Time display elements not found.");
        return; // Exit if elements aren't found
    }

    try {
        const now = new Date();
        const currentUTCMinutes = now.getUTCMinutes();

        // Calculate how many minutes past the last 5-minute mark we are
        const remainderMinutes = currentUTCMinutes % 5;

        // Calculate minutes to add to reach the *next* 5-minute mark
        // If we are exactly on a 5-min mark (remainder is 0), the next is 5 mins away.
        const minutesToAdd = (remainderMinutes === 0) ? 5 : (5 - remainderMinutes);

        // Create a new Date object representing the next indexing time
        const nextIndexing = new Date(now.getTime()); // Start with current time

        // Add the calculated minutes, letting the Date object handle rollovers (hours, days)
        nextIndexing.setUTCMinutes(currentUTCMinutes + minutesToAdd);

        // Reset seconds and milliseconds for a clean time display (e.g., 10:05:00)
        nextIndexing.setUTCSeconds(0, 0);

        // --- Format and Display ---

        let userTimeZone = 'UTC'; // Default timezone
        try {
             // Get user's time zone safely
             userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch(tzError) {
             console.warn("Could not detect user timezone, defaulting to UTC for local display.", tzError);
        }


        // Format the next indexing time in the user's local timezone (or UTC fallback)
        const localTime = nextIndexing.toLocaleTimeString([], { // Use default locale formatting
            timeZone: userTimeZone,
            hour: 'numeric',
            minute: '2-digit', // Ensures 05, not 5
            // hour12: true // Optional: uncomment for AM/PM format
        });

        // Format the next indexing time in UTC
        const utcTime = nextIndexing.toLocaleTimeString([], { // Use default locale formatting
            timeZone: 'UTC',
            hour: '2-digit',   // Ensures 08, not 8
            minute: '2-digit', // Ensures 05, not 5
            hour12: false      // Standard 24-hour format for UTC
        });

        localTimeEl.textContent = `Next indexing at ${localTime} (local time)`;
        utcTimeEl.textContent = `(${utcTime} UTC)`; // Display UTC time clearly

    } catch (error) {
        console.error("Error calculating or formatting next indexing time:", error);
        // Provide a fallback message if time zone detection or formatting fails
        localTimeEl.textContent = `Next indexing runs every 5 minutes (UTC).`;
        utcTimeEl.textContent = `Could not display specific time.`;
    }
}

// Initial call to display the time immediately on load
displayIndexingTime();

// Update the displayed time every minute (60000 milliseconds)
// This ensures the "next" time stays reasonably current
setInterval(displayIndexingTime, 60000);


// ===== Fork Now & Explore Store Button Functionality =====
const forkButton = document.getElementById('fork-button');
const exploreButton = document.getElementById('explore-button');

if (forkButton) {
    forkButton.addEventListener('click', () => {
        // Redirects the user to the fork page of the specified repository
        window.location.href = 'https://github.com/ONE-APP-STORE/config-repo/fork';
    });
}

if (exploreButton) {
    exploreButton.addEventListener('click', () => {
        // Redirects the user to the main website
        window.location.href = 'https://one-app-store.com';
    });
}

// ===== END OF SCRIPT =====
