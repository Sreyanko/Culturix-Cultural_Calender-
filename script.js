import { festivals } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    setupTheme();

    if (document.getElementById('mood-grid')) {
        initMoodExplorer();
    }

    if (document.getElementById('calendar')) {
        initCalendar();
    }

    if (document.getElementById('regions-grid')) {
        initRegions();
    }

    initAuth();
    initChat();
});

// === AUTHENTICATION ===
async function initAuth() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    try {
        const res = await fetch('/api/user');
        const data = await res.json();

        // Check if we are already on the specific pages to highlight active state if needed, 
        // but for now just appending links.

        if (res.ok && data.username) {
            // User is logged in

            // 1. Add Logbook Link
            const logbookLi = document.createElement('li');
            // Check if active
            const isLogbook = window.location.pathname.includes('logbook.html');
            logbookLi.innerHTML = `<a href="logbook.html" class="${isLogbook ? 'active' : ''}">Logbook</a>`;
            navLinks.appendChild(logbookLi);

            // 2. Add Logout Link
            const logoutLi = document.createElement('li');
            logoutLi.innerHTML = `<a href="#" id="logout-btn">Logout (${data.username})</a>`;
            navLinks.appendChild(logoutLi);

            document.getElementById('logout-btn').addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await fetch('/api/logout', { method: 'POST' });
                    window.location.href = 'home.html';
                } catch (err) {
                    console.error('Logout failed', err);
                }
            });

        } else {
            // User is not logged in

            // Add Login Link
            const loginLi = document.createElement('li');
            const isLogin = window.location.pathname.includes('login.html');
            // If on login page, maybe don't show login link or show as active?
            // Usually login page form is enough, but consistency is good.
            loginLi.innerHTML = `<a href="login.html" class="${isLogin ? 'active' : ''}">Login</a>`;
            navLinks.appendChild(loginLi);
        }

    } catch (err) {
        console.error('Failed to initialize auth nav', err);
    }
}

function setupTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const current = document.body.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
}

// === MOOD EXPLORER ===
function initMoodExplorer() {
    const buttons = document.querySelectorAll('.mood-btn');
    renderMoods('All');

    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            buttons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderMoods(e.target.textContent.trim());
        });
    });
}

function renderMoods(filter) {
    const grid = document.getElementById('mood-grid');
    if (!grid) return;

    let filtered = festivals;
    if (filter !== 'All') {
        filtered = festivals.filter(f => f.mood === filter);
    }

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="no-results">No festivals found for this mood.</div>';
        return;
    }

    grid.innerHTML = filtered.map(f => `
        <div class="feature-card mood-card" style="padding:0; overflow:hidden; text-align:left;">
            <div style="height: 200px; overflow:hidden;">
                <img src="${f.img}" alt="${f.name}" style="width:100%; height:100%; object-fit:cover; transition:transform 0.5s;">
            </div>
            <div style="padding: 1.5rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <h3 style="margin:0; font-size:1.2rem;">${f.name}</h3>
                    <span style="font-size:0.8rem; background:var(--primary); color:white; padding:0.2rem 0.5rem; border-radius:4px;">${f.date.substring(5)}</span>
                </div>
                <p style="font-size:0.9rem; opacity:0.8; margin-bottom:1rem;">${f.description || ''}</p>
                <div style="font-size:0.8rem; opacity:0.7;">
                    <strong>📍 ${f.region.toUpperCase()}</strong> • ${f.mood}
                </div>
            </div>
        </div>
    `).join('');
}

// === REGIONS ===
function initRegions() {
    // Initialize regions view if needed (similar to mood but filtered by region)
    const buttons = document.querySelectorAll('.region-btn');
    renderRegions('All');

    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            buttons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderRegions(e.target.getAttribute('data-region'));
        });
    });
}
function renderRegions(filter) {
    const grid = document.getElementById('regions-grid');
    if (!grid) return;

    let filtered = festivals;
    if (filter !== 'All') {
        filtered = festivals.filter(f => f.region === filter.toLowerCase());
    }

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="no-results">No festivals found for this region.</div>';
        return;
    }

    grid.innerHTML = filtered.map(f => `
        <div class="feature-card mood-card" style="padding:0; overflow:hidden; text-align:left;">
             <div style="height: 200px; overflow:hidden;">
                <img src="${f.img}" alt="${f.name}" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div style="padding: 1.5rem;">
                <h3 style="margin-bottom:0.5rem;">${f.name}</h3>
                <p style="font-size:0.9rem; opacity:0.8;">${f.description}</p>
                <div style="margin-top:1rem; font-size:0.85rem; color:var(--primary); font-weight:600;">
                    ${f.mood.toUpperCase()}
                </div>
            </div>
        </div>
    `).join('');
}

// === CALENDAR ===
let currentDate = new Date();
let countdownInterval;

function initCalendar() {
    setupCalendarEventListeners();
    renderCalendar();
}

function setupCalendarEventListeners() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const todayBtn = document.getElementById('todayBtn');
    const regionFilter = document.getElementById('regionFilter');
    const moodFilter = document.getElementById('moodFilter');
    const modalClose = document.getElementById('modalClose');
    const modal = document.getElementById('festivalModal');

    if (prevBtn) prevBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    if (todayBtn) todayBtn.addEventListener('click', () => { currentDate = new Date(); renderCalendar(); });

    if (regionFilter) regionFilter.addEventListener('change', renderCalendar);
    if (moodFilter) moodFilter.addEventListener('change', renderCalendar);

    if (modalClose) {
        modalClose.onclick = () => modal.classList.remove('active');
    }

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    };
}

function renderCalendar() {
    const region = document.getElementById('regionFilter').value;
    const mood = document.getElementById('moodFilter').value;

    const filtered = {};
    const currentYearStr = currentDate.getFullYear();

    // Map festivals to current year dates for display
    // Note: The data has 'date' like "2026-11-01". We should check if we strictly follow that year or ignore year?
    // The original calendar check loop used month-day. Let's stick to Month-Day matching for "annual" feel if desired,
    // OR filter strictly by the date string if we want specific 2026 calendar.
    // Given the data has "2026-...", let's try to match strict dates or fallback to recurring.
    // For simplicity, let's match Month-Day.

    festivals.forEach(f => {
        if ((region === 'all' || f.region === region) && (mood === 'all' || f.mood.toLowerCase() === mood)) {
            // Key by Month-Day: "MM-DD"
            // f.date is "YYYY-MM-DD"
            const parts = f.date.split('-'); // ["2026", "11", "01"]
            if (parts.length === 3) {
                const key = `${parts[1]}-${parts[2]}`; // "11-01"
                filtered[key] = f;
            }
        }
    });

    const statusEl = document.getElementById('filterStatus');
    if (statusEl) {
        let status = region !== 'all' && mood !== 'all' ? `${mood} festivals from ${region}` :
            region !== 'all' ? `festivals from ${region}` :
                mood !== 'all' ? `${mood} festivals` : 'all festivals';
        statusEl.textContent = 'Showing ' + status;
    }

    const cal = document.getElementById('calendar');
    const monthYear = document.getElementById('monthYear');
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed

    monthYear.textContent = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    cal.innerHTML = '';

    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => {
        const h = document.createElement('div');
        h.className = 'day-header';
        h.textContent = d;
        cal.appendChild(h);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    for (let i = 0; i < firstDay; i++) {
        const e = document.createElement('div');
        e.className = 'calendar-day empty';
        cal.appendChild(e);
    }

    let hasFest = false;
    for (let day = 1; day <= lastDate; day++) {
        const monthStr = String(month + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const key = `${monthStr}-${dayStr}`;
        const div = document.createElement('div');
        div.className = 'calendar-day';

        if (today.getDate() === day && today.getMonth() === month && today.getFullYear() === year) {
            div.classList.add('today');
        }

        div.innerHTML = `<span class="day-number">${day}</span>`;

        if (filtered[key]) {
            hasFest = true;
            const f = filtered[key];
            div.classList.add('festival-active'); // Utility class if needed
            // Use different colors for pill based on mood
            const moodClass = f.mood || 'Celebration'; // Fallback

            const pill = document.createElement('span');
            pill.className = `festival-pill ${moodClass}`;
            pill.textContent = f.name;
            pill.onclick = (e) => {
                e.stopPropagation(); // Prevent bubbling if day has click
                openModal(f);
            };
            div.appendChild(pill);

            // Make whole card clickable too for better UX
            div.style.cursor = 'pointer';
            div.onclick = () => openModal(f);
        }

        cal.appendChild(div);
    }

    if (!hasFest) {
        const nr = document.createElement('div');
        nr.className = 'no-results-calendar';
        nr.style.gridColumn = "1 / -1";
        nr.style.textAlign = "center";
        nr.style.padding = "2rem";
        nr.style.color = "var(--text)";
        nr.style.opacity = "0.7";
        nr.textContent = '✨ No festivals this month with current filters';
        cal.appendChild(nr);
    }

    updateCountdown();
}

function openModal(f) {
    const modalBody = document.getElementById('modalBody');
    if (!modalBody) return;

    modalBody.innerHTML = `
        <div class="modal-hero" style="background-image: url('${f.img}'); height: 300px; background-size: cover; background-position: center; border-radius: 12px 12px 0 0; position:relative;">
            <div style="position: absolute; bottom:0; left:0; width:100%; padding: 2rem; background: linear-gradient(transparent, rgba(0,0,0,0.8)); color: white;">
                <h2 style="font-size: 2.5rem; margin-bottom: 0.5rem; font-family: 'Playfair Display', serif;">${f.name}</h2>
                <span class="tag" style="background:var(--primary); color:white; padding: 0.3rem 0.8rem; border-radius: 4px; font-size: 0.8rem; margin-right: 0.5rem;">${f.region.toUpperCase()}</span>
                <span class="tag" style="background:white; color:black; padding: 0.3rem 0.8rem; border-radius: 4px; font-size: 0.8rem;">${f.mood.toUpperCase()}</span>
            </div>
        </div>
        <div style="padding: 2rem;">
            <div style="margin-bottom: 2rem;">
                <h3 style="color:var(--primary); margin-bottom: 0.5rem;">📖 About</h3>
                <p>${f.description}</p>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
                <div style="background: var(--bg); padding: 1.5rem; border-left: 4px solid var(--primary); border-radius: 4px;">
                    <h4 style="margin-bottom: 0.5rem;">🏛️ Origin</h4>
                    <p style="font-size: 0.9rem;">${f.origin}</p>
                </div>
                 <div style="background: var(--bg); padding: 1.5rem; border-left: 4px solid var(--accent); border-radius: 4px;">
                    <h4 style="margin-bottom: 0.5rem;">🍽️ Foods</h4>
                    <p style="font-size: 0.9rem;">${f.foods.join(', ')}</p>
                </div>
                 <div style="background: var(--bg); padding: 1.5rem; border-left: 4px solid var(--text); border-radius: 4px;">
                    <h4 style="margin-bottom: 0.5rem;">🎭 Symbolism</h4>
                    <p style="font-size: 0.9rem;">${f.symbolism}</p>
                </div>
            </div>
        </div>
    `;
    const modal = document.getElementById('festivalModal');
    if (modal) modal.classList.add('active');
}

function updateCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    const now = new Date();
    let nextDate = null, nextFest = null;

    // Sort festivals by date
    const sorted = [...festivals].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Find next festival
    for (const f of sorted) {
        if (new Date(f.date) >= now) {
            nextDate = new Date(f.date);
            nextFest = f;
            break;
        }
    }

    // If no more festivals this year, loop back to start (conceptually, though data needs to support it)
    if (!nextFest && sorted.length > 0) {
        nextFest = sorted[0];
        // Set to next year logic if needed, but for now just show specific date
        nextDate = new Date(nextFest.date);
    }

    const nameEl = document.getElementById('nextFestName');
    if (nameEl && nextFest) nameEl.textContent = nextFest.name;

    if (!nextDate) return;

    function update() {
        const diff = nextDate - new Date();
        if (diff <= 0) {
            // updateCountdown(); // recursing properly needs care
            return;
        }

        const elDays = document.getElementById('days');
        const elHours = document.getElementById('hours');
        const elMinutes = document.getElementById('minutes');
        const elSeconds = document.getElementById('seconds');

        if (elDays) elDays.textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
        if (elHours) elHours.textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
        if (elMinutes) elMinutes.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        if (elSeconds) elSeconds.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    }

    update();
    countdownInterval = setInterval(update, 1000);
}

// === CHATBOT ===
function initChat() {
    const chatWidget = document.getElementById('chat-widget');
    if (!chatWidget) return;

    const toggleBtn = document.getElementById('chat-toggle');
    const closeBtn = document.getElementById('chat-close');
    const chatWindow = document.getElementById('chat-window');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const messagesContainer = document.getElementById('chat-messages');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            chatWindow.classList.toggle('hidden');
            if (!chatWindow.classList.contains('hidden')) {
                input.focus();
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            chatWindow.classList.add('hidden');
        });
    }

    const sendMessage = async () => {
        const message = input.value.trim();
        if (!message) return;

        // Add user message
        addMessage(message, 'user');
        input.value = '';

        // Add loading state
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message';
        loadingDiv.textContent = 'Typing...';
        messagesContainer.appendChild(loadingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            // Remove loading
            messagesContainer.removeChild(loadingDiv);

            if (data.error) {
                addMessage(`Error: ${data.error}`, 'bot');
                console.error('API Error Details:', data.details);
            } else if (data.reply) {
                // Formatting the response (basic markdown to html if needed, or just text)
                addMessage(data.reply, 'bot');
            } else {
                addMessage('I am unable to respond right now. Please check if the API Key is set correctly in .env file.', 'bot');
            }
        } catch (error) {
            if (messagesContainer.contains(loadingDiv)) {
                messagesContainer.removeChild(loadingDiv);
            }
            addMessage('Error connecting to server. Please ensure the backend is running.', 'bot');
            console.error(error);
        }
    };

    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}-message`;
        // Basic safety against HTML injection if we were using innerHTML, but textContent is safe
        // If we want to support basic formatting from Gemini (like *bold*), we might need a parser.
        // For hackathon, textContent is safer and easier.
        div.textContent = text;
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}
