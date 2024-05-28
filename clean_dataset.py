import os
import json

# Define the parent directory and file paths
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
input_file_path = os.path.join(parent_dir, 'games.json')
output_file_path = os.path.join(parent_dir, 'games.json')

# Define the allowed genres
allowed_genres = {
    "Indie", "Action", "Casual", "Adventure", "Simulation",
    "RPG", "Strategy", "Free to Play", "Early Access", "Sports"
}

# Define unwanted categories
unwanted_categories = {
    "Compartilhamento de biblioteca", "Um jogador", "Multijogador", "Antitriche Valve activée", 
    "Achievement di Steam", "Cartas Colecionáveis Steam", "Carte collezionabili di Steam", 
    "Cartes à échanger Steam", "Familienbibliothek", "Um jogador", "Multijogador", "Cooperativo", 
    "Cooperativo on-line", "Conteúdo adicional", "Conquistas Steam", "Lan", 
    "Inclui editor de níveis", "Nuvem Steam", "Compat. parcial com controle", "Conquistas Steam", 
    "Partage familial", "Családi Megosztás", "Steam Felhő", "Steam Játékkártyák", "Conteúdo adicional", 
    "Steam Műhely", "Steam Teljesítmények", "Steam-Errungenschaften", "Steam-Sammelkarten", "Zusatzinhalte"
}

# Define category label normalization
category_normalization = {
    "Single-player": "Singleplayer", "Single-Player": "Singleplayer",
    "Multi-player": "Multiplayer", "Multi-Player": "Multiplayer", "multiplayer": "Multiplayer",
    "Online co-op": "Online Co-op", "LAN coop": "LAN Co-op", "LAN Coop": "LAN Co-op",
    "PvP LAN": "LAN PvP", "Family Library": "Family Library Sharing", 
    "Family Sharing": "Family Library Sharing", "Valve anti-cheat integrated": "Valve Anti-Cheat enabled",
    "HDR available": "HDR Available", "Game demo": "Game Demo", "Steam leaderboards": "Steam Leaderboards",
    "Remote play on TV devices": "Remote Play on TV", "Cross-platform multiplayer": "Cross-platform Multiplayer",
    "Online-PvP": "Online PvP"
}

# Read the dataset from the input file
with open(input_file_path, 'r', encoding='utf-8') as file:
    games = json.load(file)

# Function to normalize categories
def normalize_categories(categories):
    return [category_normalization.get(category, category) for category in categories]

# Filter the games based on the allowed genres and unwanted categories, and ensure they run on at least one platform
filtered_games = [
    {
        **game,
        "categories": normalize_categories(game["categories"])
    } for game in games
    if (
        any(genre in allowed_genres for genre in game['genres']) and
        any(platform == "True" for platform in [game["win"], game["mac"], game["linux"]]) and
        not any(category in unwanted_categories for category in game["categories"]) and
        game["description"] != "" and
        game["tags"]
    )
]

# Write the filtered dataset back to the output file
with open(output_file_path, 'w', encoding='utf-8') as file:
    json.dump(filtered_games, file, indent=2, ensure_ascii=False)

print(f"Filtered and normalized dataset saved to {output_file_path}")
