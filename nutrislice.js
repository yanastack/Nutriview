// NutriView ↔ Nutrislice integration
// Loads today's real UW–Madison Housing Dining menus and replaces the mocked
// fullMenu arrays used by the prototype. Ratings/reviews remain local demo data.

const NUTRISLICE_DISTRICT = 'wisc-housingdining';

const NUTRISLICE_HALLS = {
  "Gordon's": 'gordon-avenue-market',
  'Flakes': 'four-lakes-market',
  "Rheta's": 'rhetas-market',
  "Liz's": 'lizs-market',
  "Carson's": 'carsons-market'
};

const NUTRISLICE_MEALS = ['breakfast', 'lunch', 'dinner'];

function nutrisliceUrl(schoolSlug, mealType, date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `https://${NUTRISLICE_DISTRICT}.api.nutrislice.com/menu/api/weeks/school/${schoolSlug}/menu-type/${mealType}/${year}/${month}/${day}/?format=json`;
}

function todaysNutrisliceItems(payload, date = new Date()) {
  const localDate = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');

  const days = Array.isArray(payload?.days) ? payload.days : [];
  const today = days.find(day => day.date === localDate);
  if (!today || !Array.isArray(today.menu_items)) return [];

  return today.menu_items
    .map(item => item?.food?.name)
    .filter(name => typeof name === 'string' && name.trim().length > 0);
}

async function fetchNutrisliceMeal(schoolSlug, mealType, date = new Date()) {
  const response = await fetch(nutrisliceUrl(schoolSlug, mealType, date));
  if (!response.ok) {
    throw new Error(`Nutrislice returned ${response.status} for ${schoolSlug}/${mealType}`);
  }

  const payload = await response.json();
  return todaysNutrisliceItems(payload, date);
}

async function fetchNutrisliceHallMenu(schoolSlug, date = new Date()) {
  const results = await Promise.allSettled(
    NUTRISLICE_MEALS.map(async mealType => {
      const items = await fetchNutrisliceMeal(schoolSlug, mealType, date);
      return items.map(item => [item, mealType[0].toUpperCase() + mealType.slice(1)]);
    })
  );

  const menu = results
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value);

  // A dish can appear more than once in Nutrislice's response. Keep one row per
  // dish + meal combination so the prototype stays readable.
  return menu.filter((entry, index, all) =>
    index === all.findIndex(other => other[0] === entry[0] && other[1] === entry[1])
  );
}

async function loadRealMenus() {
  // `halls` and renderHalls() are defined by the prototype's main script.
  // This file is loaded after it, so we can update the existing hall objects
  // without rebuilding the rest of the app.
  const activeHalls = halls.filter(hall => NUTRISLICE_HALLS[hall.name]);

  await Promise.all(activeHalls.map(async hall => {
    const schoolSlug = NUTRISLICE_HALLS[hall.name];

    try {
      const realMenu = await fetchNutrisliceHallMenu(schoolSlug);
      if (realMenu.length > 0) {
        hall.fullMenu = realMenu;
        hall.menuSource = 'Nutrislice';
      }
    } catch (error) {
      // Keep the mocked menu as a fallback so the demo still works if the API
      // is unavailable or the browser blocks a cross-origin request.
      console.warn(`Could not load Nutrislice menu for ${hall.name}:`, error);
      hall.menuSource = 'demo fallback';
    }
  }));

  renderHalls();

  // If a full-menu panel is already open, refresh it with the fetched data.
  if (selectedHall && viewMode === 'all') {
    const selected = halls.find(hall => hall.name === selectedHall);
    if (selected) openFullMenu(selected);
  }
}

loadRealMenus();
