from flask import Flask, jsonify, request, send_from_directory
from urllib.parse import quote
import requests

app = Flask(__name__, static_folder='.', static_url_path='')

NUTRISLICE_DISTRICT = 'wisc-housingdining'
ALLOWED_SCHOOLS = {
    'gordon-avenue-market',
    'four-lakes-market',
    'rhetas-market',
    'lizs-market',
    'carsons-market',
}
ALLOWED_MEALS = {'breakfast', 'lunch', 'dinner'}


def build_nutrislice_url(school_slug, meal_type, year, month, day):
    safe_school = quote(school_slug, safe='-')
    safe_meal = quote(meal_type, safe='-')
    return (
        f'https://{NUTRISLICE_DISTRICT}.api.nutrislice.com/'
        f'menu/api/weeks/school/{safe_school}/menu-type/{safe_meal}/'
        f'{year}/{month}/{day}/?format=json'
    )


@app.route('/')
def home():
    return send_from_directory('.', 'with-api.html')


@app.route('/api/menu/<school_slug>/<meal_type>')
def proxy_menu(school_slug, meal_type):
    if school_slug not in ALLOWED_SCHOOLS:
        return jsonify({'error': 'Unknown dining hall'}), 404
    if meal_type not in ALLOWED_MEALS:
        return jsonify({'error': 'Unknown meal type'}), 404

    try:
        year = int(request.args['year'])
        month = int(request.args['month'])
        day = int(request.args['day'])
    except (KeyError, ValueError):
        return jsonify({'error': 'year, month, and day query parameters are required'}), 400

    upstream_url = build_nutrislice_url(school_slug, meal_type, year, month, day)

    try:
        upstream = requests.get(upstream_url, timeout=10)
        upstream.raise_for_status()
    except requests.RequestException as exc:
        return jsonify({'error': 'Nutrislice request failed', 'detail': str(exc)}), 502

    return jsonify(upstream.json())


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
