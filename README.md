# NutriView 🦡

**Know before you go.** NutriView is a dining discovery prototype for UW–Madison students that combines live dining hall menus with ratings, reviews, trending dishes, and dining hall status information.

> **A note on this repo:** This is a recreation of an earlier hackathon concept whose original code was lost. I rebuilt the project as a solo prototype. The project was developed with AI-assisted coding and debugging; the product concept, architecture, feature decisions, testing, and iteration are my own.

## What it does

- **Live dining hall menus** — pulls current UW–Madison Housing Dining menu data from Nutrislice
- **Station-based menus** — menu items are grouped by dining station instead of being shown as one long list
- **Search + trending view** — browse dishes and see what is currently trending
- **Two view modes**
  - **Trending items** — shows trending dishes across dining halls
  - **All menu** — lets users browse the full menu for each dining hall
- **Rate / Review / Alert** — users can open a dish, leave a rating, add a review, or set an alert
- **Busy tags** — dining halls display crowd-status labels such as Busy or Empty; these are currently demo data

## Live Menu Integration

NutriView uses Nutrislice, UW–Madison Housing Dining's menu provider, to retrieve live menu data.

The Nutrislice endpoint does not allow direct browser requests from NutriView because of CORS restrictions, so the app uses a small Flask backend as a proxy.

```text
Browser
  ↓
NutriView frontend
  ↓
Flask backend
  ↓
Nutrislice API
  ↓
Flask backend
  ↓
NutriView
```

The frontend requests menu data from the Flask backend.

The backend constructs the corresponding Nutrislice API request, retrieves the menu JSON, and returns it to the frontend.

NutriView then parses the response and groups menu items under their dining stations before rendering them.

Examples of stations include:

- Great Greens
- Build Your Own
- 1849
- Buckingham Bakery
- Global Kitchen
- Que Rico

Station names vary depending on the dining hall and meal.

## Tech Stack

### Frontend

- HTML
- CSS
- Vanilla JavaScript

### Backend

- Python
- Flask
- Requests

### Data

- Nutrislice menu API
- Local in-memory demo data for ratings, reviews, trending items, and busy status

## Project Structure

```text
NutriView/
├── index.html
├── nutrislice.js
├── with-api.html
├── server.py
├── requirements.txt
└── README.md
```

### `index.html`

Contains the main NutriView interface and the original prototype logic.

### `nutrislice.js`

Handles the live menu integration.

It:

- requests menu data from the Flask backend
- loads breakfast, lunch, and dinner menus
- parses Nutrislice menu responses
- groups dishes by dining station
- updates each dining hall's menu in the UI
- falls back to demo menu data if live data cannot be loaded

### `server.py`

Runs the Flask backend.

It exposes a local API endpoint that receives menu requests from the frontend and forwards them to Nutrislice.

### `requirements.txt`

Contains the Python dependencies required to run the backend.

## Running Locally

Clone or download the repository, then open a terminal inside the project folder.

Install the Python dependencies:

```bash
pip3 install -r requirements.txt
```

Start the Flask server:

```bash
python3 server.py
```

The development server should start at:

```text
http://127.0.0.1:5000
```

Open that address in a browser to use NutriView.

Do not open `index.html` directly if you want live menu data, since the Nutrislice integration requires the Flask backend.

## Current Limitations

- Ratings and reviews are stored in memory and reset when the page refreshes
- Trending data is currently based on prototype data rather than persistent user activity
- Busy / Empty dining hall status is currently static demo data
- Alerts are prototype interactions and do not send real notifications
- There are no user accounts yet
- There is no database yet
- The Flask backend currently runs locally rather than on a deployed server

## Possible Next Steps

- Persistent ratings and reviews with a database
- User accounts
- Real dish alerts and notifications
- Crowd-sourced dining hall busy status
- Better search and filtering
- Dietary and allergen filters
- Deployment of the frontend and backend
- Improved mobile UI

## Disclaimer

NutriView is a student project and is not affiliated with or endorsed by the University of Wisconsin–Madison.

The project uses an original badger illustration rather than UW's trademarked Bucky Badger artwork.
