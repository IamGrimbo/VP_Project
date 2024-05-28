import os
import json

# Define the parent directory and file paths
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
input_file_path = os.path.join(parent_dir, 'games.json')
output_file_path = os.path.join(parent_dir, 'games.json')

# Load data from games_metadata.json
metadata_file_path = os.path.join(parent_dir, 'games_metadata.json')
with open(metadata_file_path, 'r', encoding='utf-8') as metadata_file:
    metadata = [json.loads(line) for line in metadata_file if line.strip()]

# Load data from games.json with specified encoding
with open(input_file_path, 'r', encoding='utf-8') as games_file:
    games = json.load(games_file)

# Convert app_id in games to integers
games = [{**game, 'app_id': int(game['app_id'])} for game in games]

# Create a dictionary to map app_id to descriptions and tags
metadata_map = {entry['app_id']: {'description': entry['description'], 'tags': entry['tags']} for entry in metadata}

# Update games.json with descriptions and tags
for game in games:
    app_id = game['app_id']
    if app_id in metadata_map:
        game['description'] = metadata_map[app_id]['description']
        game['tags'] = metadata_map[app_id]['tags']

# Write updated data back to games.json
with open(output_file_path, 'w') as updated_games_file:
    json.dump(games, updated_games_file, indent=2)
