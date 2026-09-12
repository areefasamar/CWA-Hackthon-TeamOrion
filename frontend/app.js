// Safar Transit AI - Interactive Frontend Controller
document.addEventListener('DOMContentLoaded', () => {
  // State
  const state = {
    currentTab: 'answer', // 'answer' | 'live-tracking' | 'fare-routes' | 'sources'
    isSplitMapOpen: false,
    activeNav: 'chat-workspace',
    map: null,
    busMarker: null,
    routeLine: null,
    busAnimIndex: 0,
    busAnimTimer: null,
    isListening: false,
    toastTimeout: null
  };

  // DOM Elements
  const splitMapContainer = document.getElementById('split-map-container');
  const mainChatCol = document.getElementById('main-chat-col');
  const toggleMapBtn = document.getElementById('toggle-map-btn');
  const conversationStream = document.getElementById('conversation-stream');
  const promptInput = document.getElementById('prompt-input');
  const sendBtn = document.getElementById('send-btn');
  const micBtn = document.getElementById('mic-btn');
  const voiceModal = document.getElementById('voice-modal');
  const cmdPaletteModal = document.getElementById('cmd-palette-modal');
  const newJourneyBtn = document.getElementById('new-journey-btn');
  const scheduleModal = document.getElementById('schedule-modal');
  const alertModal = document.getElementById('alert-modal');
  const toastEl = document.getElementById('safar-toast');
  const toastMsg = document.getElementById('safar-toast-msg');
  const sourcesDrawer = document.getElementById('sources-drawer');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('safar-sidebar');

  // Initialize Map
  function initLeafletMap() {
    if (state.map) return;
    const initialCoords = [24.8825, 67.0345];
    state.map = L.map('leaflet-map', {
      zoomControl: false,
      attributionControl: false
    }).setView(initialCoords, 13);

    // Modern clean tile layer (CartoDB Positron / OSM compatible)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(state.map);

    // Zoom controls customized
    L.control.zoom({ position: 'topright' }).addTo(state.map);

    // Plot Route 104 Express
    const route = window.SafarTransitData.routes[0];
    const pathCoords = route.pathCoordinates;

    // Glowing polyline
    L.polyline(pathCoords, {
      color: '#c3c0ff',
      weight: 8,
      opacity: 0.6
    }).addTo(state.map);

    state.routeLine = L.polyline(pathCoords, {
      color: '#3525cd',
      weight: 4,
      opacity: 0.95,
      dashArray: '8, 4'
    }).addTo(state.map);

    // Station Markers
    route.stops.forEach((stop, idx) => {
      const isOrigin = idx === 0;
      const isDest = idx === route.stops.length - 1;
      const markerColor = isOrigin ? '#3525cd' : (isDest ? '#0051d5' : '#484757');
      
      const customIcon = L.divIcon({
        className: 'custom-station-wrapper',
        html: `
          <div style="background: ${markerColor};" class="custom-station-marker"></div>
          <div style="position: absolute; left: 24px; top: -4px; white-space: nowrap; background: rgba(255,255,255,0.92); backdrop-filter: blur(8px); padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #131b2e; border: 1px solid rgba(79,70,229,0.15); box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            ${stop.name} (${stop.platform})
          </div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      L.marker([stop.lat, stop.lng], { icon: customIcon }).addTo(state.map)
        .bindPopup(`<b>${stop.name}</b><br>${stop.platform}<br>Scheduled: ${stop.time}`);
    });

    // Bus Icon for Fleet PK-889
    const busIcon = L.divIcon({
      className: 'bus-icon-container',
      html: `
        <div class="custom-bus-marker">
          <span class="material-symbols-outlined" style="font-size: 20px;">directions_bus</span>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    state.busMarker = L.marker(pathCoords[0], { icon: busIcon }).addTo(state.map)
      .bindPopup(`<b>Route 104 Express</b><br>Fleet #PK-889<br>Speed: 48 km/h • Dual AC Active`);

    startBusSimulation();
  }

  // Live Bus Movement Simulation
  function startBusSimulation() {
    if (state.busAnimTimer) clearInterval(state.busAnimTimer);
    const coords = window.SafarTransitData.routes[0].pathCoordinates;
    state.busAnimIndex = 0;

    state.busAnimTimer = setInterval(() => {
      if (!state.map || !state.busMarker) return;
      state.busAnimIndex = (state.busAnimIndex + 1) % coords.length;
      const targetPos = coords[state.busAnimIndex];
      state.busMarker.setLatLng(targetPos);

      // Update Live Telematics Overlay if open
      const liveSpeedEl = document.getElementById('map-live-speed');
      const liveNextStopEl = document.getElementById('map-live-next-stop');
      if (liveSpeedEl) {
        const randomSpeed = Math.floor(44 + Math.random() * 8);
        liveSpeedEl.innerText = `${randomSpeed} km/h`;
      }
      if (liveNextStopEl) {
        const nextStopName = state.busAnimIndex < 3 ? "Metropolitan Flyover" : "Innovation Tech Park";
        liveNextStopEl.innerText = nextStopName;
      }
    }, 3500);
  }

  // Split Screen Map Toggle
  window.toggleSplitMap = function (forceState) {
    state.isSplitMapOpen = forceState !== undefined ? forceState : !state.isSplitMapOpen;
    
    if (state.isSplitMapOpen) {
      splitMapContainer.classList.remove('hidden');
      splitMapContainer.classList.add('flex');
      mainChatCol.classList.remove('max-w-4xl', 'mx-auto');
      mainChatCol.classList.add('w-full');
      if (toggleMapBtn) {
        toggleMapBtn.classList.add('bg-primary', 'text-on-primary');
        toggleMapBtn.classList.remove('bg-surface-container', 'text-on-surface-variant');
        toggleMapBtn.querySelector('.btn-label').innerText = 'Close Map Split';
      }
      setTimeout(() => {
        initLeafletMap();
        if (state.map) state.map.invalidateSize();
      }, 100);
      showToast('Live transit telematics map active');
    } else {
      splitMapContainer.classList.add('hidden');
      splitMapContainer.classList.remove('flex');
      mainChatCol.classList.add('max-w-4xl', 'mx-auto');
      mainChatCol.classList.remove('w-full');
      if (toggleMapBtn) {
        toggleMapBtn.classList.remove('bg-primary', 'text-on-primary');
        toggleMapBtn.classList.add('bg-surface-container', 'text-on-surface-variant');
        toggleMapBtn.querySelector('.btn-label').innerText = 'Split Map';
      }
    }
  };

  if (toggleMapBtn) {
    toggleMapBtn.addEventListener('click', () => window.toggleSplitMap());
  }

  // Mode Tabs Switching
  window.switchModeTab = function (tab) {
    state.currentTab = tab;
    document.querySelectorAll('.mode-tab-btn').forEach(btn => {
      const btnTab = btn.getAttribute('data-tab');
      if (btnTab === tab) {
        btn.classList.add('bg-surface-container', 'text-primary');
        btn.classList.remove('hover:bg-surface-container-low', 'text-on-surface-variant');
      } else {
        btn.classList.remove('bg-surface-container', 'text-primary');
        btn.classList.add('hover:bg-surface-container-low', 'text-on-surface-variant');
      }
    });

    if (tab === 'live-tracking') {
      window.toggleSplitMap(true);
    } else if (tab === 'fare-routes') {
      window.sendFollowUpQuery('View full weekly transit fare table');
    } else if (tab === 'sources') {
      toggleSourcesDrawer(true);
    }
  };

  // Toast System
  window.showToast = function (message, duration = 3000) {
    if (state.toastTimeout) clearTimeout(state.toastTimeout);
    if (!toastEl || !toastMsg) return;
    toastMsg.innerText = message;
    toastEl.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
    toastEl.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');

    state.toastTimeout = setTimeout(() => {
      toastEl.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
      toastEl.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
    }, duration);
  };

  // Copy Query Handler
  window.copyQueryText = function (btn) {
    const queryCard = btn.closest('.user-query-card');
    const textEl = queryCard ? queryCard.querySelector('.query-text') : null;
    const textToCopy = textEl ? textEl.innerText.trim() : "Find fastest route to Innovation Tech Park";

    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('Query copied to clipboard!');
    }).catch(() => {
      showToast('Copied to clipboard!');
    });
  };

  // Edit Query Handler
  window.editQueryText = function (btn) {
    const queryCard = btn.closest('.user-query-card');
    const textEl = queryCard ? queryCard.querySelector('.query-text') : null;
    if (textEl && promptInput) {
      promptInput.value = textEl.innerText.trim();
      promptInput.focus();
      promptInput.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Departure Alert Modal Handlers
  window.openAlertModal = function () {
    if (alertModal) {
      alertModal.classList.remove('hidden');
      alertModal.classList.add('flex');
    }
  };

  window.closeAlertModal = function () {
    if (alertModal) {
      alertModal.classList.add('hidden');
      alertModal.classList.remove('flex');
    }
  };

  window.confirmDepartureAlert = function (timeOffset) {
    closeAlertModal();
    showToast(`🔔 Departure Alert set for ${timeOffset} before departure at Platform 2B!`);
  };

  // Schedule Download & Modal Handlers
  window.openScheduleModal = function () {
    if (scheduleModal) {
      scheduleModal.classList.remove('hidden');
      scheduleModal.classList.add('flex');
    }
  };

  window.closeScheduleModal = function () {
    if (scheduleModal) {
      scheduleModal.classList.add('hidden');
      scheduleModal.classList.remove('flex');
    }
  };

  // Sources Drawer Handlers
  window.toggleSourcesDrawer = function (forceOpen) {
    if (!sourcesDrawer) return;
    const shouldOpen = forceOpen !== undefined ? forceOpen : sourcesDrawer.classList.contains('translate-x-full');
    if (shouldOpen) {
      sourcesDrawer.classList.remove('translate-x-full');
    } else {
      sourcesDrawer.classList.add('translate-x-full');
    }
  };

  // Command Palette Handler
  window.toggleCmdPalette = function (forceOpen) {
    if (!cmdPaletteModal) return;
    const isOpen = !cmdPaletteModal.classList.contains('hidden');
    const shouldOpen = forceOpen !== undefined ? forceOpen : !isOpen;

    if (shouldOpen) {
      cmdPaletteModal.classList.remove('hidden');
      cmdPaletteModal.classList.add('flex');
      const input = document.getElementById('cmd-palette-input');
      if (input) setTimeout(() => input.focus(), 50);
    } else {
      cmdPaletteModal.classList.add('hidden');
      cmdPaletteModal.classList.remove('flex');
    }
  };

  if (newJourneyBtn) {
    newJourneyBtn.addEventListener('click', () => window.toggleCmdPalette(true));
  }

  // Keyboard Shortcuts (Ctrl+K or Cmd+K)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      window.toggleCmdPalette();
    }
    if (e.key === 'Escape') {
      window.toggleCmdPalette(false);
      closeAlertModal();
      closeScheduleModal();
      toggleSourcesDrawer(false);
      stopVoiceRecording();
    }
  });

  // Voice Search Simulation
  window.startVoiceRecording = function () {
    if (state.isListening) return;
    state.isListening = true;
    if (voiceModal) {
      voiceModal.classList.remove('hidden');
      voiceModal.classList.add('flex');
    }

    // Auto simulate spoken query after 3 seconds
    setTimeout(() => {
      if (state.isListening) {
        stopVoiceRecording();
        if (promptInput) {
          promptInput.value = "Show live location of Route 104 Express";
          submitUserQuery();
        }
      }
    }, 3200);
  };

  window.stopVoiceRecording = function () {
    state.isListening = false;
    if (voiceModal) {
      voiceModal.classList.add('hidden');
      voiceModal.classList.remove('flex');
    }
  };

  if (micBtn) {
    micBtn.addEventListener('click', startVoiceRecording);
  }

  // Conversational AI Engine & Streaming Response
  function submitUserQuery(customText) {
    const query = customText || (promptInput ? promptInput.value.trim() : "");
    if (!query) return;

    if (promptInput) promptInput.value = "";

    // 1. Append Traveler Query Card
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userCardHtml = `
      <div class="user-query-card bg-surface-container-lowest rounded-lg p-space-lg shadow-[0_4px_20px_-2px_rgba(79,70,229,0.06)] flex flex-col gap-space-sm animate-fade-in">
        <div class="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
          <div class="flex items-center gap-space-xs">
            <span class="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-label-sm">U</span>
            <span class="font-label-md text-label-md text-on-surface font-semibold">Traveler Query</span>
            <span>•</span>
            <span>${timeString}</span>
          </div>
          <div class="flex items-center gap-space-xs">
            <button onclick="editQueryText(this)" class="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition" title="Edit query" type="button">
              <span class="material-symbols-outlined text-title-sm">edit</span>
            </button>
            <button onclick="copyQueryText(this)" class="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition" title="Copy text" type="button">
              <span class="material-symbols-outlined text-title-sm">content_copy</span>
            </button>
          </div>
        </div>
        <p class="query-text font-title-md text-title-md text-on-surface font-semibold leading-snug">
          ${escapeHtml(query)}
        </p>
      </div>
    `;

    // 2. Append Skeleton / Thinking Card
    const thinkingCardId = 'thinking-' + Date.now();
    const thinkingHtml = `
      <div id="${thinkingCardId}" class="bg-surface-container-lowest rounded-lg p-space-lg shadow-[0_10px_30px_-5px_rgba(79,70,229,0.08)] flex flex-col gap-space-md animate-pulse">
        <div class="flex items-center gap-space-xs text-primary font-label-sm text-label-sm font-semibold">
          <span class="w-2 h-2 rounded-full bg-primary-container animate-ping"></span>
          <span>Consulting GTFS-RT Telematics and Corridor Sensors...</span>
        </div>
        <div class="h-4 bg-surface-container-low rounded-full w-3/4"></div>
        <div class="h-4 bg-surface-container-low rounded-full w-1/2"></div>
      </div>
    `;

    conversationStream.insertAdjacentHTML('beforeend', userCardHtml);
    conversationStream.insertAdjacentHTML('beforeend', thinkingHtml);
    conversationStream.lastElementChild.scrollIntoView({ behavior: 'smooth' });

    // 3. Resolve Answer after realistic delay
    setTimeout(() => {
      const thinkingEl = document.getElementById(thinkingCardId);
      if (thinkingEl) thinkingEl.remove();

      generateAiResponse(query);
    }, 1400);
  }

  function generateAiResponse(query) {
    const canned = window.SafarTransitData.cannedAnswers[query];

    let aiCardHtml = '';
    if (canned && canned.isTable) {
      // Render Fare Table Card
      aiCardHtml = `
        <div class="bg-surface-container-lowest rounded-lg p-space-lg shadow-[0_10px_30px_-5px_rgba(79,70,229,0.08)] flex flex-col gap-space-lg animate-fade-in">
          <div class="flex flex-wrap items-center justify-between gap-space-xs pb-space-xs">
            <div class="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-full">
              <span class="w-2 h-2 rounded-full bg-secondary-container animate-ping"></span>
              <span class="material-symbols-outlined text-label-md text-primary">hub</span>
              <span class="font-label-sm text-label-sm text-on-surface font-semibold">Verified Tariff Database</span>
              <span class="text-on-surface-variant text-label-sm">•</span>
              <span class="font-label-sm text-label-sm text-on-surface-variant">1.4s latency</span>
            </div>
          </div>
          <div class="flex flex-col gap-space-xs text-on-surface leading-relaxed">
            <p class="font-body-lg text-body-lg">${canned.summary}</p>
          </div>
          <div class="overflow-x-auto rounded-lg border border-surface-container">
            <table class="w-full text-left font-body-sm text-body-sm">
              <thead class="bg-surface-container text-on-surface font-label-sm text-label-sm">
                <tr>
                  <th class="p-space-sm">Distance / Zone</th>
                  <th class="p-space-sm">Single Tap</th>
                  <th class="p-space-sm">Unlimited Day Pass</th>
                  <th class="p-space-sm">Monthly Pass</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-container-low">
                ${window.SafarTransitData.fareTable.map(row => `
                  <tr class="hover:bg-surface-container-lowest transition">
                    <td class="p-space-sm font-semibold text-on-surface">${row.distance}</td>
                    <td class="p-space-sm font-bold text-primary">${row.singlePass}</td>
                    <td class="p-space-sm text-on-surface-variant">${row.dayPass}</td>
                    <td class="p-space-sm text-secondary font-semibold">${row.monthly}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="flex flex-wrap gap-space-xs pt-space-xs">
            <button onclick="window.toggleSplitMap(true)" class="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-sm" type="button">
              <span class="material-symbols-outlined text-title-sm">map</span>
              <span>View Route Zones on Map</span>
            </button>
            <button onclick="window.openScheduleModal()" class="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              <span class="material-symbols-outlined text-title-sm">download</span>
              <span>Export PDF Fare Matrix</span>
            </button>
          </div>
          ${renderFollowUpChips(canned.followUps)}
        </div>
      `;
    } else if (canned && canned.routeCard) {
      const rc = canned.routeCard;
      aiCardHtml = `
        <div class="bg-surface-container-lowest rounded-lg p-space-lg shadow-[0_10px_30px_-5px_rgba(79,70,229,0.08)] flex flex-col gap-space-lg animate-fade-in">
          <div class="flex flex-wrap items-center justify-between gap-space-xs pb-space-xs">
            <div class="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-full">
              <span class="w-2 h-2 rounded-full bg-secondary-container animate-ping"></span>
              <span class="material-symbols-outlined text-label-md text-primary">hub</span>
              <span class="font-label-sm text-label-sm text-on-surface font-semibold">Researched 4 transit feeds</span>
              <span class="text-on-surface-variant text-label-sm">•</span>
              <span class="font-label-sm text-label-sm text-on-surface-variant">1.9s latency</span>
            </div>
            <div class="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
              <span class="material-symbols-outlined text-title-sm text-secondary">verified_user</span>
              <span>Verified GTFS 2026.4</span>
            </div>
          </div>

          <div class="flex flex-col gap-space-xs">
            <div class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Sources Consulted</div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-space-xs">
              ${canned.sources.map(src => `
                <div class="p-space-xs px-space-sm rounded-DEFAULT bg-surface-container-low flex items-center gap-space-xs">
                  <span class="material-symbols-outlined text-title-sm text-primary">check_circle</span>
                  <span class="font-label-sm text-label-sm text-on-surface font-semibold truncate">${src}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="flex flex-col gap-space-xs text-on-surface leading-relaxed">
            <p class="font-body-lg text-body-lg">${canned.summary}</p>
            <p class="font-body-md text-body-md text-on-surface-variant">${rc.note}</p>
          </div>

          <div class="rounded-lg bg-surface-container-low p-space-md flex flex-col gap-space-md shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-space-xs">
              <div class="flex items-center gap-space-sm">
                <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm">
                  <span class="material-symbols-outlined text-headline-sm">directions_transit</span>
                </div>
                <div class="flex flex-col">
                  <div class="flex items-center gap-space-xs">
                    <span class="font-title-sm text-title-sm font-bold text-on-surface">${rc.name}</span>
                    <span class="px-space-xs py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm">${rc.badge}</span>
                  </div>
                  <span class="font-body-sm text-body-sm text-on-surface-variant">${rc.departureTime}</span>
                </div>
              </div>
              <div class="flex items-center gap-space-xs bg-surface-container px-space-sm py-1 rounded-full text-secondary font-label-sm text-label-sm font-semibold">
                <span class="w-2 h-2 rounded-full bg-secondary"></span>
                Active Service
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-space-xs pt-space-xs">
              <div class="p-space-sm rounded-DEFAULT bg-surface-container-lowest flex items-center justify-between">
                <span class="font-body-sm text-body-sm text-on-surface-variant">Trip Time</span>
                <span class="font-title-sm text-title-sm text-on-surface font-semibold">${rc.duration}</span>
              </div>
              <div class="p-space-sm rounded-DEFAULT bg-surface-container-lowest flex items-center justify-between">
                <span class="font-body-sm text-body-sm text-on-surface-variant">Tap Fare</span>
                <span class="font-title-sm text-title-sm text-on-surface font-semibold">${rc.fare}</span>
              </div>
              <div class="p-space-sm rounded-DEFAULT bg-surface-container-lowest flex items-center justify-between">
                <span class="font-body-sm text-body-sm text-on-surface-variant">Occupancy</span>
                <span class="font-title-sm text-title-sm text-on-surface font-semibold">${rc.occupancy}</span>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-space-xs pt-space-xs">
              <button onclick="window.toggleSplitMap(true)" class="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-sm" type="button">
                <span class="material-symbols-outlined text-title-sm">map</span>
                <span>Track Live on Map</span>
              </button>
              <button onclick="window.openScheduleModal()" class="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container text-on-surface font-label-md text-label-md" type="button">
                <span class="material-symbols-outlined text-title-sm">download</span>
                <span>Download Schedule</span>
              </button>
              <button onclick="window.openAlertModal()" class="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container text-on-surface font-label-md text-label-md" type="button">
                <span class="material-symbols-outlined text-title-sm">notifications_active</span>
                <span>Set Departure Alert</span>
              </button>
            </div>
          </div>
          ${renderFollowUpChips(canned.followUps)}
        </div>
      `;
    } else {
      // Dynamic General Transit Query Answer
      aiCardHtml = `
        <div class="bg-surface-container-lowest rounded-lg p-space-lg shadow-[0_10px_30px_-5px_rgba(79,70,229,0.08)] flex flex-col gap-space-lg animate-fade-in">
          <div class="flex flex-wrap items-center justify-between gap-space-xs pb-space-xs">
            <div class="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-full">
              <span class="w-2 h-2 rounded-full bg-secondary-container animate-ping"></span>
              <span class="material-symbols-outlined text-label-md text-primary">hub</span>
              <span class="font-label-sm text-label-sm text-on-surface font-semibold">Researched Safar Transit Graph</span>
              <span class="text-on-surface-variant text-label-sm">•</span>
              <span class="font-label-sm text-label-sm text-on-surface-variant">1.8s latency</span>
            </div>
            <div class="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
              <span class="material-symbols-outlined text-title-sm text-secondary">verified_user</span>
              <span>Verified GTFS Schedule 2026.4</span>
            </div>
          </div>

          <div class="flex flex-col gap-space-xs text-on-surface leading-relaxed">
            <p class="font-body-lg text-body-lg">
              For <strong>"${escapeHtml(query)}"</strong>, the optimal transit option is <strong class="text-primary font-title-sm">Route 104 Express</strong> departing from <strong>Central Station Platform 2B</strong> in <strong>4 minutes</strong>.
            </p>
            <p class="font-body-md text-body-md text-on-surface-variant">
              The service operates with active climate-control AC and tap-to-pay validator gates. Real-time GPS telematics indicate zero delays along the elevated corridor.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-space-xs pt-space-xs">
            <button onclick="window.toggleSplitMap(true)" class="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-sm" type="button">
              <span class="material-symbols-outlined text-title-sm">map</span>
              <span>Track Live on Map</span>
            </button>
            <button onclick="window.openScheduleModal()" class="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container text-on-surface font-label-md text-label-md" type="button">
              <span class="material-symbols-outlined text-title-sm">download</span>
              <span>Download Schedule</span>
            </button>
          </div>

          ${renderFollowUpChips([
            "What are the evening return trip timings?",
            "Alternative Blue Metro Line connection",
            "View full weekly transit fare table"
          ])}
        </div>
      `;
    }

    conversationStream.insertAdjacentHTML('beforeend', aiCardHtml);
    conversationStream.lastElementChild.scrollIntoView({ behavior: 'smooth' });
  }

  function renderFollowUpChips(chips) {
    if (!chips || chips.length === 0) return '';
    return `
      <div class="flex flex-col gap-space-xs pt-space-xs">
        <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Suggested Follow-ups</span>
        <div class="flex flex-wrap gap-space-xs">
          ${chips.map(chip => `
            <button onclick="window.sendFollowUpQuery('${escapeHtml(chip)}')" class="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-primary-fixed text-primary hover:bg-primary hover:text-on-primary transition font-label-md text-label-md" type="button">
              <span class="material-symbols-outlined text-label-sm">search</span>
              <span>${escapeHtml(chip)}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  window.sendFollowUpQuery = function (queryText) {
    submitUserQuery(queryText);
  };

  if (sendBtn) {
    sendBtn.addEventListener('click', () => submitUserQuery());
  }

  if (promptInput) {
    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitUserQuery();
      }
    });
  }

  // Sidebar navigation switcher
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const path = link.getAttribute('data-path');
      state.activeNav = path;

      document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('bg-surface-container-highest', 'text-primary', 'font-semibold');
        l.classList.add('text-on-surface-variant');
      });

      link.classList.add('bg-surface-container-highest', 'text-primary', 'font-semibold');
      link.classList.remove('text-on-surface-variant');

      if (path === 'live-telematics') {
        window.toggleSplitMap(true);
      } else if (path === 'transit-schedules') {
        window.openScheduleModal();
      } else if (path === 'saved-routes') {
        showToast('Viewing Saved Routes (Route 104 Express, Blue Metro Line)');
      } else if (path === 'transit-library') {
        window.sendFollowUpQuery('View full weekly transit fare table');
      }
      
      // Close mobile drawer if opened
      if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.add('-translate-x-full');
      }
    });
  });

  // Mobile menu button
  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('-translate-x-full');
    });
  }

  // Quick Command Palette Selection
  window.selectCmdAction = function (action) {
    window.toggleCmdPalette(false);
    if (action === 'new-query') {
      if (promptInput) {
        promptInput.focus();
        promptInput.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (action === 'track-104') {
      window.toggleSplitMap(true);
    } else if (action === 'metro-line') {
      window.sendFollowUpQuery('Alternative Blue Metro Line connection');
    } else if (action === 'fare-table') {
      window.sendFollowUpQuery('View full weekly transit fare table');
    } else if (action === 'schedules') {
      window.openScheduleModal();
    }
  };

  // Recent chat loaders
  document.querySelectorAll('.recent-chat-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const title = item.getAttribute('data-title');
      if (title) {
        window.sendFollowUpQuery(title);
      }
    });
  });

  // Utility
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[m];
    });
  }
});
