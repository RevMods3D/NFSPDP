const cards = document.querySelectorAll('.info-card');
window.addEventListener('scroll', () => {
  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      card.classList.add('show');
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  // --- Handle Add Pursuit Form (add-pursuit.html) ---
  const form = document.getElementById('pursuitForm');
  if (form) {
    // Create hidden iframe for form submission
    let iframe = document.createElement('iframe');
    iframe.name = 'hidden_iframe';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    form.target = 'hidden_iframe';
    form.action = 'https://script.google.com/macros/s/AKfycbzCDsPaN6cVYGWMOCT3AxbrZSOK7OigLZzddj-pdJ94vE7ZmcfJNOrv6MefQPCSKAxe/exec';
    form.method = 'POST';

    form.addEventListener('submit', (e) => {
      alert('Pursuit logged successfully!');
      setTimeout(() => form.reset(), 100);
    });
  }

  // --- Load Pursuits Table (pursuits.html) ---
  const tableBody = document.querySelector('#pursuitTable tbody');
  if (tableBody) {
    window.displayPursuits = function (data) {
      tableBody.innerHTML = '';
      data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${row.officer || ''}</td>
          <td>${row.suspect || ''}</td>
          <td>${row.vehicle || ''}</td>
          <td>${(row.date || '').split('T')[0]}</td>
          <td>${row.duration || ''}</td>
          <td>${row.outcome || ''}</td>
          <td>${row.notes || ''}</td>
        `;
        tableBody.appendChild(tr);
      });
    };

    // Fetch data from Google Apps Script (with cache-busting)
    const script = document.createElement('script');
    script.src =
      'https://script.google.com/macros/s/AKfycbzCDsPaN6cVYGWMOCT3AxbrZSOK7OigLZzddj-pdJ94vE7ZmcfJNOrv6MefQPCSKAxe/exec?callback=displayPursuits&t=' +
      new Date().getTime();
    document.body.appendChild(script);
  }

  // --- Load Officers Table (read-only) ---
  const officerTableBody = document.querySelector('#officerTable tbody');
  if (officerTableBody) {
    // Use your new dynamic rendering function
    window.displayOfficers = function (data) {
      renderOfficersTable(data);
    };

    // Load the officer data from your Apps Script
    const script = document.createElement('script');
    script.src =
      'https://script.google.com/macros/s/AKfycbzCDsPaN6cVYGWMOCT3AxbrZSOK7OigLZzddj-pdJ94vE7ZmcfJNOrv6MefQPCSKAxe/exec?callback=displayOfficers&mode=officers&t=' +
      new Date().getTime();
    document.body.appendChild(script);
  }

});

const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('keyup', () => {
    const filter = searchInput.value.toLowerCase();
    const table = document.querySelector('#pursuitTable');
    const rows = table.querySelectorAll('tbody tr');

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(filter) ? '' : 'none';
    });
  });
}

const officerSearch = document.getElementById('officerSearch');
if (officerSearch) {
  officerSearch.addEventListener('keyup', () => {
    const filter = officerSearch.value.toLowerCase();
    const table = document.querySelector('#officerTable');
    const rows = table.querySelectorAll('tbody tr');

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(filter) ? '' : 'none';
    });
  });
}


document.addEventListener('DOMContentLoaded', () => {
  const selectWrappers = document.querySelectorAll('.custom-select-wrapper');

  selectWrappers.forEach(wrapper => {
    const trigger = wrapper.querySelector('.custom-select-trigger');
    const options = wrapper.querySelectorAll('.custom-option');
    const hiddenInput = wrapper.querySelector('input[type="hidden"]');

    trigger.addEventListener('click', () => {
      wrapper.classList.toggle('open');
    });

    options.forEach(option => {
      option.addEventListener('click', () => {
        trigger.textContent = option.textContent;
        hiddenInput.value = option.dataset.value;
        wrapper.classList.remove('open');
      });
    });
  });

  // Close all selects if clicking outside
  document.addEventListener('click', e => {
    selectWrappers.forEach(wrapper => {
      if (!wrapper.contains(e.target)) {
        wrapper.classList.remove('open');
      }
    });
  });
});

// Map page filenames to the columns you want to show
const pageColumnsMap = {
  "officers.html": ["name", "rank", "division", "badge", "status", "notes"], // all columns
  "promotion.html": ["name", "rank", "nRank", "officerDate"]        // only selected columns
};

// Optional: friendly header names for each column
const columnHeaders = {
  name: "Officer",
  rank: "Previous Rank",
  nRank: "New Rank",
  officerDate: "Date"
};

function renderOfficersTable(data) {
  const tableBody = document.querySelector('#officerTable tbody');
  const tableHead = document.querySelector('#officerTable thead tr');
  if (!tableBody || !tableHead) return;

  const path = window.location.pathname.split("/").pop();
  const visibleCols = pageColumnsMap[path] || Object.keys(data[0] || {});

  // Update headers
  tableHead.innerHTML = '';
  visibleCols.forEach(key => {
    tableHead.innerHTML += `<th>${columnHeaders[key] || key}</th>`;
  });

  // Render rows
  tableBody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    visibleCols.forEach(key => {
      tr.innerHTML += `<td>${row[key] || ''}</td>`;
    });
    tableBody.appendChild(tr);
  });
}





// Most Wanted System - Complete Logic

// Suspect Database Class
class SuspectDatabase {
  constructor() {
    this.suspects = new Map();
    this.loadFromStorage();
  }

  // Load existing data from localStorage
  loadFromStorage() {
    const saved = localStorage.getItem('nfspd_suspects');
    if (saved) {
      const data = JSON.parse(saved);
      this.suspects = new Map(Object.entries(data));
      console.log(`Loaded ${this.suspects.size} suspects from localStorage`);
    }
  }

  // Save to localStorage
  saveToStorage() {
    const data = Object.fromEntries(this.suspects);
    localStorage.setItem('nfspd_suspects', JSON.stringify(data));
  }

  // Update suspect heat based on pursuit outcome
  updateSuspectHeat(suspectName, outcome, pursuitDate) {
    if (!suspectName || suspectName.trim() === '') return null;

    const normalizedName = suspectName.trim().toLowerCase();
    let suspect = this.suspects.get(normalizedName);

    if (!suspect) {
      // New suspect
      suspect = {
        name: suspectName.trim(),
        heatLevel: 0,
        totalPursuits: 0,
        arrests: 0,
        terminations: 0,
        escapes: 0,
        lastOutcome: null,
        lastPursuitDate: null,
        pursuitHistory: []
      };
    }

    // Update pursuit counts
    suspect.totalPursuits++;
    suspect.lastPursuitDate = pursuitDate;
    suspect.lastOutcome = outcome.toLowerCase();

    // Record pursuit history
    suspect.pursuitHistory.push({
      date: pursuitDate,
      outcome: outcome.toLowerCase()
    });

    // Sort history by date
    suspect.pursuitHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Update counts and heat based on outcome
    switch (outcome.toLowerCase()) {
      case 'arrested':
        suspect.arrests++;
        suspect.heatLevel = 0; // Reset heat on arrest
        break;
      case 'terminated':
        suspect.terminations++;
        suspect.heatLevel += 2; // Increase heat significantly
        break;
      case 'escaped':
        suspect.escapes++;
        suspect.heatLevel += 1; // Increase heat moderately
        break;
      default:
        // Unknown outcome, no change
        break;
    }

    // Cap heat level at 10
    suspect.heatLevel = Math.min(suspect.heatLevel, 10);
    suspect.heatLevel = Math.max(suspect.heatLevel, 0);

    // Store updated suspect
    this.suspects.set(normalizedName, suspect);
    this.saveToStorage();

    return suspect;
  }

  // Get suspect by name
  getSuspect(name) {
    if (!name) return null;
    return this.suspects.get(name.trim().toLowerCase());
  }

  // Get all suspects
  getAllSuspects() {
    return Array.from(this.suspects.values());
  }

  // Get suspects sorted by heat level
  getSuspectsByHeat() {
    return this.getAllSuspects().sort((a, b) => b.heatLevel - a.heatLevel);
  }

  // Get top wanted suspects
  getMostWanted(limit = 10) {
    return this.getSuspectsByHeat().slice(0, limit);
  }
}

// Create global instance
const suspectDB = new SuspectDatabase();

// Function to fetch and process all pursuits from Google Apps Script
function loadPursuitsForSuspects() {
  console.log('Loading pursuits for suspects...');
  
  // Check if we already have data in localStorage
  const existingSuspects = suspectDB.getAllSuspects();
  if (existingSuspects.length > 0) {
    console.log(`Using ${existingSuspects.length} suspects from localStorage`);
    displayMostWanted();
    updateStatistics();
  } else {
    console.log('No localStorage data, fetching from Google Apps Script...');
  }
  
  // Create a temporary callback to process pursuit data
  window.processPursuitsForSuspects = function (data) {
    console.log('Received pursuit data:', data);
    
    if (!data || data.length === 0) {
      console.log('No pursuit data received');
      return;
    }
    
    // Clear existing suspect data to rebuild from scratch
    suspectDB.suspects.clear();
    
    // Process all pursuits in chronological order
    const sortedPursuits = data.sort((a, b) => {
      const dateA = new Date(a.date || a.timestamp || 0);
      const dateB = new Date(b.date || b.timestamp || 0);
      return dateA - dateB;
    });
    
    sortedPursuits.forEach(pursuit => {
      const suspectName = pursuit.suspect || pursuit.suspectName || '';
      const outcome = pursuit.outcome || '';
      const date = pursuit.date || pursuit.timestamp || new Date().toISOString();
      
      if (suspectName && outcome) {
        // Update suspect heat based on this pursuit
        suspectDB.updateSuspectHeat(suspectName, outcome, date);
      }
    });
    
    console.log(`Loaded ${suspectDB.getAllSuspects().length} suspects from pursuit data`);
    
    // Update the display
    displayMostWanted();
    updateStatistics();
  };
  
  // Fetch pursuit data from Google Apps Script
  const script = document.createElement('script');
  script.src =
    'https://script.google.com/macros/s/AKfycbzCDsPaN6cVYGWMOCT3AxbrZSOK7OigLZzddj-pdJ94vE7ZmcfJNOrv6MefQPCSKAxe/exec?callback=processPursuitsForSuspects&mode=pursuits&t=' +
    new Date().getTime();
  
  script.onerror = function() {
    console.error('Failed to load data from Google Apps Script');
    // Use localStorage data if available
    if (suspectDB.getAllSuspects().length > 0) {
      displayMostWanted();
      updateStatistics();
    }
  };
  
  document.body.appendChild(script);
}

// Helper function to get wanted level text based on heat
function getWantedLevel(heatLevel) {
  if (heatLevel >= 9) return '🔴 MOST WANTED';
  if (heatLevel >= 7) return '🟠 HIGHLY WANTED';
  if (heatLevel >= 5) return '🟡 WANTED';
  if (heatLevel >= 3) return '🟢 MODERATELY WANTED';
  if (heatLevel >= 1) return '⚪ LOW PRIORITY';
  return '✅ NOT WANTED';
}

// Helper function to get heat level class
function getHeatLevelClass(heatLevel) {
  if (heatLevel >= 8) return 'extreme';
  if (heatLevel >= 6) return 'very-high';
  if (heatLevel >= 4) return 'high';
  if (heatLevel >= 2) return 'medium';
  if (heatLevel >= 1) return 'low';
  return 'cold';
}

// Helper function to get heat color
function getHeatColor(heatLevel) {
  if (heatLevel >= 7) return '#ff4444'; // Red
  if (heatLevel >= 4) return '#ffaa00'; // Orange
  if (heatLevel >= 1) return '#ffdd00'; // Yellow
  return '#00ff88'; // Green
}

// Helper function to get heat class for modal
function getHeatClass(heatLevel) {
  if (heatLevel >= 7) return 'high';
  if (heatLevel >= 4) return 'medium';
  if (heatLevel >= 1) return 'low';
  return 'zero';
}

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Helper function to get outcome emoji
function getOutcomeEmoji(outcome) {
  switch (outcome.toLowerCase()) {
    case 'arrested':
      return '✅';
    case 'escaped':
      return '🏃';
    case 'terminated':
      return '💀';
    default:
      return '❓';
  }
}

// Function to display most wanted suspects
function displayMostWanted(searchTerm = '', heatFilter = 'all') {
  const container = document.getElementById('mostWantedList');
  if (!container) {
    console.log('Container not found');
    return;
  }

  let suspects = suspectDB.getAllSuspects();
  console.log(`Displaying ${suspects.length} suspects`);

  // Apply search filter
  if (searchTerm) {
    suspects = suspects.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Apply heat filter
  if (heatFilter !== 'all') {
    suspects = suspects.filter(s => {
      switch (heatFilter) {
        case 'high': return s.heatLevel >= 7;
        case 'medium': return s.heatLevel >= 4 && s.heatLevel <= 6;
        case 'low': return s.heatLevel >= 1 && s.heatLevel <= 3;
        case 'cold': return s.heatLevel === 0;
        default: return true;
      }
    });
  }

  // Enhanced sorting algorithm
  suspects.sort((a, b) => {
    // Primary sort: Heat level (highest first)
    if (b.heatLevel !== a.heatLevel) {
      return b.heatLevel - a.heatLevel;
    }

    // Secondary sort: Most recent activity (most recent first)
    const dateA = a.lastPursuitDate ? new Date(a.lastPursuitDate).getTime() : 0;
    const dateB = b.lastPursuitDate ? new Date(b.lastPursuitDate).getTime() : 0;
    if (dateB !== dateA) {
      return dateB - dateA;
    }

    // Tertiary sort: Total pursuits (most pursued first)
    if (b.totalPursuits !== a.totalPursuits) {
      return b.totalPursuits - a.totalPursuits;
    }

    // Final sort: Alphabetical (A-Z)
    return a.name.localeCompare(b.name);
  });

  if (suspects.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #aaa;">No suspects found</p>';
    return;
  }

  container.innerHTML = '';

  suspects.forEach((suspect, index) => {
    const item = document.createElement('div');
    item.className = 'most-wanted-item';

    // Get heat level class
    const heatClass = getHeatLevelClass(suspect.heatLevel);
    item.classList.add(`heat-${heatClass}`);

    // Add special class for high priority
    if (suspect.heatLevel >= 7) {
      item.classList.add('high-priority');
    }

    // Add class for top spot
    if (index === 0 && suspect.heatLevel > 0) {
      item.classList.add('most-wanted-top');
    }

    // Generate heat bar
    const heatPercentage = (suspect.heatLevel / 10) * 100;
    const heatColor = getHeatColor(suspect.heatLevel);

    // Generate wanted level text
    const wantedLevel = getWantedLevel(suspect.heatLevel);

    item.innerHTML = `
      <div class="wanted-rank">#${index + 1}</div>
      <div class="wanted-info">
        <div class="wanted-name">
          ${suspect.name}
          ${suspect.heatLevel >= 7 ? '<span class="priority-badge">HIGH PRIORITY</span>' : ''}
          ${index === 0 && suspect.heatLevel > 0 ? '<span class="top-badge">MOST WANTED</span>' : ''}
        </div>
        <div class="wanted-level" style="color: ${heatColor};">${wantedLevel}</div>
        <div class="heat-bar-container">
          <div class="heat-bar">
            <div class="heat-fill" style="width: ${heatPercentage}%; background: ${heatColor};"></div>
          </div>
          <span class="heat-number">${suspect.heatLevel}/10</span>
        </div>
        <div class="wanted-stats">
          Arrests: ${suspect.arrests} | Escapes: ${suspect.escapes} | 
          Terminations: ${suspect.terminations} | Total Pursuits: ${suspect.totalPursuits}
          <br>
          Last Outcome: ${suspect.lastOutcome || 'N/A'} | 
          Last Seen: ${formatDate(suspect.lastPursuitDate) || 'Unknown'}
        </div>
      </div>
      <div class="wanted-actions">
        <button class="view-history-btn" onclick="viewHistory('${suspect.name.replace(/'/g, "\\'")}')">
          📊 View History
        </button>
      </div>
    `;

    container.appendChild(item);
  });
}

// Update statistics display
function updateStatistics() {
  const totalSuspectsEl = document.getElementById('totalSuspects');
  const highPriorityEl = document.getElementById('highPriority');
  const totalArrestsEl = document.getElementById('totalArrests');
  const totalEscapesEl = document.getElementById('totalEscapes');

  if (!totalSuspectsEl) return;

  const allSuspects = suspectDB.getAllSuspects();
  const highPriority = allSuspects.filter(s => s.heatLevel >= 7).length;
  const totalArrests = allSuspects.reduce((sum, s) => sum + s.arrests, 0);
  const totalEscapes = allSuspects.reduce((sum, s) => sum + s.escapes, 0);

  totalSuspectsEl.textContent = allSuspects.length;
  highPriorityEl.textContent = highPriority;
  totalArrestsEl.textContent = totalArrests;
  totalEscapesEl.textContent = totalEscapes;
}

// View suspect history with modal
function viewHistory(suspectName) {
  const suspect = suspectDB.getSuspect(suspectName);
  if (!suspect) return;

  // Create modal overlay
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';

  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content history-modal';

  // Build history HTML
  let historyHTML = '';
  if (suspect.pursuitHistory.length === 0) {
    historyHTML = '<div class="no-history">No pursuit history available</div>';
  } else {
    historyHTML = '<div class="history-list">';
    // Show last 15 pursuits
    const recentPursuits = suspect.pursuitHistory.slice(-15).reverse();

    recentPursuits.forEach((pursuit) => {
      const outcomeClass = pursuit.outcome.toLowerCase();
      const outcomeEmoji = getOutcomeEmoji(pursuit.outcome);
      const dateFormatted = formatDate(pursuit.date) || 'Unknown date';

      historyHTML += `
        <div class="history-item ${outcomeClass}">
          <div class="history-date">📅 ${dateFormatted}</div>
          <div class="history-outcome">
            ${outcomeEmoji} ${pursuit.outcome.toUpperCase()}
          </div>
        </div>
      `;
    });
    historyHTML += '</div>';
  }

  // Get initials for avatar
  const initials = suspect.name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();

  modalContent.innerHTML = `
    <div class="modal-header">
      <h2>
        <span class="suspect-avatar">${initials}</span>
        ${suspect.name}
      </h2>
      <button class="close-modal" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="suspect-summary">
        <div class="summary-item">
          <span class="summary-label">Current Heat</span>
          <span class="summary-value heat-${getHeatClass(suspect.heatLevel)}">${suspect.heatLevel}/10</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Total Pursuits</span>
          <span class="summary-value">${suspect.totalPursuits}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Arrests</span>
          <span class="summary-value arrests">${suspect.arrests}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Escapes</span>
          <span class="summary-value escapes">${suspect.escapes}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Terminations</span>
          <span class="summary-value terminations">${suspect.terminations}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Last Outcome</span>
          <span class="summary-value">${suspect.lastOutcome ? suspect.lastOutcome.toUpperCase() : 'N/A'}</span>
        </div>
      </div>
      
      <div class="heat-visual">
        <div class="heat-bar-large">
          <div class="heat-fill-large" style="width: ${(suspect.heatLevel / 10) * 100}%; background: ${getHeatColor(suspect.heatLevel)}; color: ${getHeatColor(suspect.heatLevel)};"></div>
        </div>
        <div class="heat-text">
          <span class="heat-label">Heat Level</span>
          <span class="heat-value" style="color: ${getHeatColor(suspect.heatLevel)};">${suspect.heatLevel}/10</span>
        </div>
      </div>
      
      <h3 class="history-title">Recent Pursuit History</h3>
      ${historyHTML}
    </div>
  `;

  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  // Add animation class after a small delay
  setTimeout(() => {
    modalOverlay.classList.add('show');
    modalContent.classList.add('show');
  }, 10);

  // Close modal when clicking outside
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

// Close modal function
function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

// Initialize filter functionality
function initializeFilter() {
  const filterButton = document.getElementById('filterButton');
  const filterDropdown = document.getElementById('filterDropdown');
  const filterOptions = document.querySelectorAll('.filter-option');
  const filterButtonText = document.querySelector('.filter-button-text');
  const hiddenSelect = document.getElementById('heatFilter');
  const searchInput = document.getElementById('searchSuspect');
  const clearSearch = document.getElementById('clearSearch');

  if (!filterButton || !filterDropdown) {
    console.log('Filter elements not found');
    return;
  }

  // Toggle dropdown
  filterButton.addEventListener('click', (e) => {
    e.stopPropagation();
    filterDropdown.classList.toggle('show');
    filterButton.classList.toggle('active');
  });

  // Handle filter option selection
  filterOptions.forEach(option => {
    option.addEventListener('click', () => {
      const value = option.dataset.value;
      const text = option.textContent.trim();

      // Update hidden select
      if (hiddenSelect) {
        hiddenSelect.value = value;
      }

      // Update button text
      filterButtonText.textContent = text;

      // Update active state
      filterOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');

      // Close dropdown
      filterDropdown.classList.remove('show');
      filterButton.classList.remove('active');

      // Apply filter
      const currentSearch = searchInput ? searchInput.value : '';
      displayMostWanted(currentSearch, value);
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!filterButton.contains(e.target) && !filterDropdown.contains(e.target)) {
      filterDropdown.classList.remove('show');
      filterButton.classList.remove('active');
    }
  });

  // Search functionality
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const value = e.target.value;
      const currentFilter = hiddenSelect ? hiddenSelect.value : 'all';

      // Show/hide clear button
      if (clearSearch) {
        clearSearch.style.display = value ? 'block' : 'none';
      }

      // Apply search
      displayMostWanted(value, currentFilter);
    });

    // Clear search
    if (clearSearch) {
      clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        clearSearch.style.display = 'none';
        const currentFilter = hiddenSelect ? hiddenSelect.value : 'all';
        displayMostWanted('', currentFilter);
        searchInput.focus();
      });
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing...');
  
  // Initialize custom filter
  initializeFilter();

  // Load suspects automatically
  loadPursuitsForSuspects();
});

// Export functions for use in other scripts if needed
window.suspectDB = suspectDB;
window.displayMostWanted = displayMostWanted;
window.updateStatistics = updateStatistics;
window.viewHistory = viewHistory;
window.loadPursuitsForSuspects = loadPursuitsForSuspects;