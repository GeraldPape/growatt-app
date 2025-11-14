// State management
let autoRefreshInterval = null;
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// DOM elements
const plantContainer = document.getElementById('plantContainer');
const deviceContainer = document.getElementById('deviceContainer');
const refreshBtn = document.getElementById('refreshBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const lastUpdateEl = document.getElementById('lastUpdate');
const cacheInfoEl = document.getElementById('cacheInfo');

// Initialize the dashboard
async function init() {
    console.log('Initializing Growatt Dashboard...');

    // Set up event listeners
    refreshBtn.addEventListener('click', handleRefresh);

    // Load initial data
    await loadAllData();

    // Start auto-refresh
    startAutoRefresh();
}

// Load all data
async function loadAllData() {
    updateStatus('loading', 'Loading data...');

    try {
        await Promise.all([
            loadPlantData(),
            loadDeviceData(),
            updateCacheStatus()
        ]);

        updateStatus('success', 'Connected');
        updateLastUpdate();
    } catch (error) {
        console.error('Error loading data:', error);
        updateStatus('error', 'Error loading data');
    }
}

// Load plant data
async function loadPlantData() {
    try {
        const response = await fetch('/api/plants');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error_code !== undefined && data.error_code !== 0) {
            throw new Error(data.error_msg || 'API error');
        }

        displayPlantData(data);
    } catch (error) {
        console.error('Error loading plant data:', error);
        plantContainer.innerHTML = `
            <div class="error">
                <strong>Error loading plant data:</strong> ${error.message}
            </div>
        `;
    }
}

// Load device data
async function loadDeviceData() {
    try {
        const response = await fetch('/api/devices');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.code !== undefined && data.code !== 0) {
            throw new Error(data.message || 'API error');
        }

        displayDeviceData(data);
    } catch (error) {
        console.error('Error loading device data:', error);
        deviceContainer.innerHTML = `
            <div class="error">
                <strong>Error loading device data:</strong> ${error.message}
            </div>
        `;
    }
}

// Display plant data
function displayPlantData(data) {
    if (!data.data || !data.data.plants || data.data.plants.length === 0) {
        plantContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏭</div>
                <div class="empty-state-text">No plants found</div>
            </div>
        `;
        return;
    }

    const plants = data.data.plants;
    const isCached = data.cached || false;

    plantContainer.innerHTML = plants.map(plant => `
        <div class="card">
            <div class="card-header">
                <div class="card-title">${escapeHtml(plant.name)}</div>
                <span class="card-badge ${plant.status === 1 ? 'badge-active' : 'badge-inactive'}">
                    ${plant.status === 1 ? 'Active' : 'Inactive'}
                </span>
            </div>
            <div class="card-body">
                <div class="power-display">
                    <div class="power-value">${formatNumber(plant.current_power)} W</div>
                    <div class="power-label">Current Power</div>
                </div>

                <div class="energy-display">
                    <div class="energy-value">${formatNumber(plant.total_energy)} kWh</div>
                    <div class="energy-label">Total Energy</div>
                </div>

                <div class="info-row">
                    <span class="info-label">📍 Location</span>
                    <span class="info-value">${escapeHtml(plant.city)}, ${escapeHtml(plant.country)}</span>
                </div>

                <div class="info-row">
                    <span class="info-label">🌐 Coordinates</span>
                    <span class="info-value">${plant.latitude}, ${plant.longitude}</span>
                </div>

                <div class="info-row">
                    <span class="info-label">⚡ Peak Power</span>
                    <span class="info-value">${formatNumber(plant.peak_power)} kW</span>
                </div>

                <div class="info-row">
                    <span class="info-label">📅 Created</span>
                    <span class="info-value">${plant.create_date}</span>
                </div>

                <div class="info-row">
                    <span class="info-label">🆔 Plant ID</span>
                    <span class="info-value">${plant.plant_id}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Display device data
function displayDeviceData(data) {
    if (!data.data || !data.data.data || data.data.data.length === 0) {
        deviceContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚙️</div>
                <div class="empty-state-text">No devices found</div>
            </div>
        `;
        return;
    }

    const devices = data.data.data;
    const isCached = data.cached || false;

    deviceContainer.innerHTML = devices.map(device => `
        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    ${getDeviceTypeIcon(device.deviceType)}
                    ${escapeHtml(device.deviceType.toUpperCase())}
                </div>
            </div>
            <div class="card-body">
                <div class="info-row">
                    <span class="info-label">📟 Device Serial</span>
                    <span class="info-value">${escapeHtml(device.deviceSn)}</span>
                </div>

                <div class="info-row">
                    <span class="info-label">📡 Datalog Serial</span>
                    <span class="info-value">${escapeHtml(device.datalogSn)}</span>
                </div>

                <div class="info-row">
                    <span class="info-label">📅 Created</span>
                    <span class="info-value">${device.createDate}</span>
                </div>

                <div class="info-row">
                    <span class="info-label">🔧 Type</span>
                    <span class="info-value">${getDeviceTypeName(device.deviceType)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Update cache status
async function updateCacheStatus() {
    try {
        const response = await fetch('/api/cache-status');
        const status = await response.json();

        const plantCacheAge = status.plants.cacheAge;
        const deviceCacheAge = status.devices.cacheAge;

        let infoText = 'Cache: ';

        if (plantCacheAge !== null) {
            infoText += `Plants (${formatCacheAge(plantCacheAge)})`;
        } else {
            infoText += 'Plants (no cache)';
        }

        if (deviceCacheAge !== null) {
            infoText += ` | Devices (${formatCacheAge(deviceCacheAge)})`;
        } else {
            infoText += ' | Devices (no cache)';
        }

        cacheInfoEl.textContent = infoText;
    } catch (error) {
        console.error('Error fetching cache status:', error);
        cacheInfoEl.textContent = 'Cache: Unknown';
    }
}

// Handle refresh button click
async function handleRefresh() {
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<span class="btn-icon">⏳</span> Refreshing...';

    await loadAllData();

    refreshBtn.disabled = false;
    refreshBtn.innerHTML = '<span class="btn-icon">🔄</span> Refresh Data';
}

// Start auto-refresh
function startAutoRefresh() {
    // Clear any existing interval
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }

    // Set up new interval
    autoRefreshInterval = setInterval(async () => {
        console.log('Auto-refreshing data...');
        await loadAllData();
    }, REFRESH_INTERVAL);

    console.log(`Auto-refresh enabled: every ${REFRESH_INTERVAL / 1000} seconds`);
}

// Update status indicator
function updateStatus(status, text) {
    statusText.textContent = text;

    statusDot.classList.remove('error');

    if (status === 'error') {
        statusDot.classList.add('error');
    }
}

// Update last update time
function updateLastUpdate() {
    const now = new Date();
    lastUpdateEl.textContent = now.toLocaleString();
}

// Helper functions
function formatNumber(value) {
    if (value === null || value === undefined || value === '') {
        return '0';
    }
    return parseFloat(value).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function formatCacheAge(seconds) {
    if (seconds < 60) {
        return `${seconds}s ago`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ago`;
    } else {
        const hours = Math.floor(seconds / 3600);
        return `${hours}h ago`;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getDeviceTypeIcon(type) {
    const icons = {
        'sph': '🔋',
        'inverter': '⚡',
        'storage': '🔋',
        'datalog': '📡'
    };
    return icons[type.toLowerCase()] || '⚙️';
}

function getDeviceTypeName(type) {
    const names = {
        'sph': 'Hybrid Inverter (SPH)',
        'inverter': 'Solar Inverter',
        'storage': 'Battery Storage',
        'datalog': 'Data Logger'
    };
    return names[type.toLowerCase()] || type.toUpperCase();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
});
