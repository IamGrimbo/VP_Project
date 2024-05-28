import json
import os
import requests
from tenacity import retry, stop_after_attempt, wait_fixed

# Function to retrieve list of all games on Steam
def get_steam_games():
    response = requests.get('https://api.steampowered.com/ISteamApps/GetAppList/v2/')
    if response.status_code == 200:
        return response.json()['applist']['apps']
    else:
        return None

# Get list of all games on Steam
steam_games = get_steam_games()

# Dictionary to map app_id to tags
tags_dict = {}

# Build tags_dict from steam_games
for game in steam_games:
    app_id = str(game['appid'])  # Convert app ID to string
    tags_dict[app_id] = game.get('tags', [])

# Get the parent directory
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# Load the JSON data from file with explicit UTF-8 encoding
input_file_path = os.path.join(parent_dir, 'games.json')
with open(input_file_path, 'r', encoding='utf-8') as file:
    games = json.load(file)

# Convert app IDs in your dataset to strings
for game in games:
    game['app_id'] = str(game['app_id'])

# List to store games with successful data fetching
updated_games = []

# Retry configuration for API requests
@retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
def fetch_game_details(app_id):
    response = requests.get(f"https://store.steampowered.com/api/appdetails?appids={app_id}")
    if response.status_code == 200:
        data = response.json().get(app_id, {})
        if data.get('success', False):
            return data['data']
    return None

# Add the image URL and categories to each game
for game in games:
    app_id = game['app_id']
    print("Processing game with app ID:", app_id)  # Debugging
    game['image'] = f"https://steamcdn-a.akamaihd.net/steam/apps/{app_id}/header.jpg"
    # Fetch categories and genres from Steam API for the current game
    try:
        data = fetch_game_details(app_id)
        if data:
            categories = [category['description'] for category in data.get('categories', [])]
            genres = [genre['description'] for genre in data.get('genres', [])]
            game['categories'] = categories
            game['genres'] = genres
            updated_games.append(game)
            print("Categories for this game:", categories)  # Debugging
            print("Genres for this game:", genres)  # Debugging
        else:
            print("Failed to fetch data for app ID:", app_id)
    except Exception as e:
        print(f"Error fetching data for app ID {app_id}: {e}")

# Define the paths for the output file
output_file_path = os.path.join(parent_dir, 'games.json')

# Save the updated JSON data back to file with UTF-8 encoding
with open(output_file_path, 'w', encoding='utf-8') as file:
    json.dump(updated_games, file, indent=2)

print("Images and categories added successfully!")