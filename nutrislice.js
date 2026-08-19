// NutriView ↔ Nutrislice integration
// Loads today's real UW–Madison Housing Dining menus through our Flask proxy.
// Ratings/reviews remain local demo data.

const NUTRISLICE_HALLS = {
  "Gordon's": 'gordon-avenue-market',
  'Flakes': 'four-lakes-market',
  "Rheta's": 'rhetas-market',
  "Liz's": 'lizs-market',
  "Carson's": 'carsons-market'
};

const NUTRISLICE_MEALS = ['breakfast', 'lunch', 'dinner'];

function proxyUrl(schoolSlug, mealType, date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `/api/menu/${schoolSlug}/${mealType}?year=${year}&month=${month}&day=${day}`;
}

function localDateString(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

function todaysMenuDay(payload, date = new Date()) {
  const days = Array.isArray(payload?.days) ? payload.days : [];
  return days.find(day => day.date === localDateString(date)) || null;
}

// Nutrislice places station headers and food rows in the same ordered menu_items
// array. We walk through it once, remembering the latest station header and
// assigning following foods to that station.
function parseStations(payload, mealType, date = new Date()) {
  const today = todaysMenuDay(payload, date);
  if (!today || !Array.isArray(today.menu_items)) return [];

  const sections = [];
  let currentSection = null;

  function ensureSection(name) {
    const cleanName = (name || 'Other').trim() || 'Other';
    let section = sections.find(s => s.name === cleanName);
    if (!section) {
      section = { name: cleanName, items: [] };
      sections.push(section);
    }
    return section;
  }

  for (const item of today.menu_items) {
    const headerText = typeof item?.text === 'string' ? item.text.trim() : '';

    if ((item?.is_station_header || item?.is_section_title) && headerText) {
      currentSection = ensureSection(headerText);
      continue;
    }

    const foodName = item?.food?.name;
    if (typeof foodName !== 'string' || !foodName.trim()) continue;

    const section = currentSection || ensureSection('Other');
    const calories = item?.food?.rounded_nutrition_info?.calories;

    section.items.push({
      name: foodName.trim(),
      meal: mealType[0].toUpperCase() + mealType.slice(1),
      calories: Number.isFinite(calories) ? calories : null
    });
  }

  return sections.filter(section => section.items.length > 0);
}

async function fetchNutrisliceMeal(schoolSlug, mealType, date = new Date()) {
  const response = await fetch(proxyUrl(schoolSlug, mealType, date));
  if (!response.ok) {
    throw new Error(`Proxy returned ${response.status} for ${schoolSlug}/${mealType}`);
  }

  const payload = await response.json();
  return parseStations(payload, mealType, date);
}

async function fetchNutrisliceHallMenu(schoolSlug, date = new Date()) {
  const results = await Promise.allSettled(
    NUTRISLICE_MEALS.map(mealType => fetchNutrisliceMeal(schoolSlug, mealType, date))
  );

  const mergedSections = [];

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;

    for (const incoming of result.value) {
      let section = mergedSections.find(s => s.name === incoming.name);
      if (!section) {
        section = { name: incoming.name, items: [] };
        mergedSections.push(section);
      }

      for (const item of incoming.items) {
        const duplicate = section.items.some(existing =>
          existing.name === item.name && existing.meal === item.meal
        );
        if (!duplicate) section.items.push(item);
      }
    }
  }

  return mergedSections;
}

function flattenStationMenu(stations) {
  return stations.flatMap(section =>
    section.items.map(item => [item.name, item.meal])
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// Replace the prototype's flat full-menu panel with a station-based view when
// live Nutrislice data is available. If it is not, use the original renderer.
const originalOpenFullMenu = typeof openFullMenu === 'function' ? openFullMenu : null;

if (originalOpenFullMenu) {
  openFullMenu = function(hall) {
    if (!Array.isArray(hall.stationMenus) || hall.stationMenus.length === 0) {
      return originalOpenFullMenu(hall);
    }

    const panel = document.getElementById('menuPanel');
    panel.classList.add('open');

    const itemCount = hall.stationMenus.reduce((total, section) => total + section.items.length, 0);

    panel.innerHTML = `
      <h3>${escapeHtml(hall.name)} &mdash; Full Menu</h3>
      <div class="dish-halls">${itemCount} live items today &middot; Nutrislice</div>
      ${hall.stationMenus.map(section => `
        <div style="margin-top:22px;">
          <h4 style="font-family:'Space Grotesk',sans-serif;font-size:17px;margin-bottom:8px;">${escapeHtml(section.name)}</h4>
          <div class="full-menu-list">
            ${section.items.map(item => `
              <div class="full-menu-item">
                <span>${escapeHtml(item.name)}${item.calories !== null ? ` <span style="color:var(--ink-soft);font-size:12px;">${item.calories} Cal</span>` : ''}</span>
                <span class="meal">${escapeHtml(item.meal)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    `;

    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
}

async function loadRealMenus() {
  const activeHalls = halls.filter(hall => NUTRISLICE_HALLS[hall.name]);

  await Promise.all(activeHalls.map(async hall => {
    const schoolSlug = NUTRISLICE_HALLS[hall.name];

    try {
      const stationMenus = await fetchNutrisliceHallMenu(schoolSlug);
      if (stationMenus.length > 0) {
        hall.stationMenus = stationMenus;
        hall.fullMenu = flattenStationMenu(stationMenus);
        hall.menuSource = 'Nutrislice via local proxy';
      }
    } catch (error) {
      console.warn(`Could not load Nutrislice menu for ${hall.name}:`, error);
      hall.menuSource = 'demo fallback';
    }
  }));

  renderHalls();

  if (selectedHall && viewMode === 'all') {
    const selected = halls.find(hall => hall.name === selectedHall);
    if (selected) openFullMenu(selected);
  }
}

if (typeof halls !== 'undefined' && typeof renderHalls === 'function') {
  loadRealMenus();
}
