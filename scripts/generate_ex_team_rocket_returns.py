#!/usr/bin/env python3
"""
Script to generate EX Team Rocket Returns card dataset.
"""

import json
import re

# Card data from the user
CARD_DATA = """
1/109 	Azumarill 	Water 	Rare Holo
2/109 	Dark Ampharos 	LightningDarkness 	Rare Holo
3/109 	Dark Crobat 	GrassDarkness 	Rare Holo
4/109 	Dark Electrode 	LightningDarkness 	Rare Holo
5/109 	Dark Houndoom 	FireDarkness 	Rare Holo
6/109 	Dark Hypno 	PsychicDarkness 	Rare Holo
7/109 	Dark Marowak 	FightingDarkness 	Rare Holo
8/109 	Dark Octillery 	WaterDarkness 	Rare Holo
9/109 	Dark Slowking 	PsychicDarkness 	Rare Holo
10/109 	Dark Steelix 	DarknessMetal 	Rare Holo
11/109 	Jumpluff 	Grass 	Rare Holo
12/109 	Kingdra 	Water 	Rare Holo
13/109 	Piloswine 	Fighting 	Rare Holo
14/109 	Togetic 	Colorless 	Rare Holo
15/109 	Dark Dragonite 	Darkness 	Rare
16/109 	Dark Muk 	GrassDarkness 	Rare
17/109 	Dark Raticate 	Darkness 	Rare
18/109 	Dark Sandslash 	FightingDarkness 	Rare
19/109 	Dark Tyranitar 	Darkness 	Rare
20/109 	Dark Tyranitar 	FightingDarkness 	Rare
21/109 	Delibird 	Water 	Rare
22/109 	Furret 	Colorless 	Rare
23/109 	Ledian 	Grass 	Rare
24/109 	Magby 	Fire 	Rare
25/109 	Misdreavus 	Psychic 	Rare
26/109 	Quagsire 	Water 	Rare
27/109 	Qwilfish 	Water 	Rare
28/109 	Yanma 	Grass 	Rare
29/109 	Dark Arbok 	GrassDarkness 	Uncommon
30/109 	Dark Ariados 	GrassDarkness 	Uncommon
31/109 	Dark Dragonair 	Darkness 	Uncommon
32/109 	Dark Dragonair 	Darkness 	Uncommon
33/109 	Dark Flaaffy 	LightningDarkness 	Uncommon
34/109 	Dark Golbat 	GrassDarkness 	Uncommon
35/109 	Dark Golduck 	WaterDarkness 	Uncommon
36/109 	Dark Gyarados 	WaterDarkness 	Uncommon
37/109 	Dark Houndoom 	FireDarkness 	Uncommon
38/109 	Dark Magcargo 	FireDarkness 	Uncommon
39/109 	Dark Magneton 	LightningDarkness 	Uncommon
40/109 	Dark Pupitar 	FightingDarkness 	Uncommon
41/109 	Dark Pupitar 	FightingDarkness 	Uncommon
42/109 	Dark Weezing 	GrassDarkness 	Uncommon
43/109 	Heracross 	Fighting 	Uncommon
44/109 	Magmar 	Fire 	Uncommon
45/109 	Mantine 	Water 	Uncommon
46/109 	Rocket's Meowth 	Darkness 	Uncommon
47/109 	Rocket's Wobbuffet 	Darkness 	Uncommon
48/109 	Seadra 	Water 	Uncommon
49/109 	Skiploom 	Grass 	Uncommon
50/109 	Togepi 	Colorless 	Uncommon
51/109 	Cubone 	Fighting 	Common
52/109 	Dratini 	Colorless 	Common
53/109 	Dratini 	Colorless 	Common
54/109 	Drowzee 	Psychic 	Common
55/109 	Ekans 	Grass 	Common
56/109 	Grimer 	Grass 	Common
57/109 	Hoppip 	Grass 	Common
58/109 	Horsea 	Water 	Common
59/109 	Houndour 	Fire 	Common
60/109 	Houndour 	Fire 	Common
61/109 	Koffing 	Grass 	Common
62/109 	Larvitar 	Fighting 	Common
63/109 	Larvitar 	Fighting 	Common
64/109 	Ledyba 	Grass 	Common
65/109 	Magikarp 	Water 	Common
66/109 	Magnemite 	Lightning 	Common
67/109 	Mareep 	Lightning 	Common
68/109 	Marill 	Water 	Common
69/109 	Onix 	Fighting 	Common
70/109 	Psyduck 	Water 	Common
71/109 	Rattata 	Colorless 	Common
72/109 	Rattata 	Colorless 	Common
73/109 	Remoraid 	Water 	Common
74/109 	Sandshrew 	Fighting 	Common
75/109 	Sentret 	Colorless 	Common
76/109 	Slowpoke 	Psychic 	Common
77/109 	Slugma 	Fire 	Common
78/109 	Spinarak 	Grass 	Common
79/109 	Swinub 	Fighting 	Common
80/109 	Voltorb 	Lightning 	Common
81/109 	Wooper 	Water 	Common
82/109 	Zubat 	Grass 	Common
83/109 	Copycat 	T [Su] 	Uncommon
84/109 	Pokémon Retriever 	T [R] 	Uncommon
85/109 	Pow! Hand Extension 	T [R] 	Uncommon
86/109 	Rocket's Admin. 	T [Su] 	Uncommon
87/109 	Rocket's Hideout 	T [St] 	Uncommon
88/109 	Rocket's Mission 	T [Su] 	Uncommon
89/109 	Rocket's Poké Ball 	T 	Uncommon
90/109 	Rocket's Tricky Gym 	T [St] 	Uncommon
91/109 	Surprise! Time Machine 	T [R] 	Uncommon
92/109 	Swoop! Teleporter 	T [R] 	Uncommon
93/109 	Venture Bomb 	T [R] 	Uncommon
94/109 	Dark Metal Energy 	Darkness E 	Uncommon
95/109 	R Energy 	Darkness E 	Uncommon
96/109 	Rocket's Articuno ex 	Darkness 	Rare Holo ex
97/109 	Rocket's Entei ex 	Darkness 	Rare Holo ex
98/109 	Rocket's Hitmonchan ex 	Darkness 	Rare Holo ex
99/109 	Rocket's Mewtwo ex 	Darkness 	Rare Holo ex
100/109 	Rocket's Moltres ex 	Darkness 	Rare Holo ex
101/109 	Rocket's Scizor ex 	Darkness 	Rare Holo ex
102/109 	Rocket's Scyther ex 	Darkness 	Rare Holo ex
103/109 	Rocket's Sneasel ex 	Darkness 	Rare Holo ex
104/109 	Rocket's Snorlax ex 	Darkness 	Rare Holo ex
105/109 	Rocket's Suicune ex 	Darkness 	Rare Holo ex
106/109 	Rocket's Zapdos ex 	Darkness 	Rare Holo ex
107/109 	Mudkip Star 	Water 	Rare Holo ☆
108/109 	Torchic Star 	Fire 	Rare Holo ☆
109/109 	Treecko Star 	Grass 	Rare Holo ☆
110/109 	Charmeleon 	Fire 	Rare Secret
111/109 	Here Comes Team Rocket! 	T [Su] 	Rare Secret
"""

def parse_type(type_str):
    """Parse the type string to handle dual types and special types"""
    if type_str.startswith('T '):
        return 'Trainer'
    elif 'Darkness E' in type_str:
        return 'Energy'
    elif len(type_str) > 10 and 'Darkness' in type_str:
        # Handle dual types like "LightningDarkness" -> primary type "Lightning"
        if 'Lightning' in type_str:
            return 'Lightning'
        elif 'Grass' in type_str:
            return 'Grass'
        elif 'Water' in type_str:
            return 'Water'
        elif 'Fire' in type_str:
            return 'Fire'
        elif 'Fighting' in type_str:
            return 'Fighting'
        elif 'Psychic' in type_str:
            return 'Psychic'
        elif 'Metal' in type_str:
            return 'Metal'
        else:
            return 'Darkness'
    else:
        return type_str

def clean_name(name):
    """Clean card name for keyword generation"""
    # Handle special characters
    name = name.replace("'", '').replace('.', '').replace('!', '').replace(' ', '').lower()
    return name

def generate_matching_keywords(name, card_number, set_name, set_code, rarity, card_type):
    """Generate matching keywords for the card"""
    keywords = []
    
    # Basic name variations
    name_clean = clean_name(name)
    keywords.extend([
        name,
        name_clean,
        f"{set_code.lower().replace('-', '')}{name_clean}",
        f"teamrocketreturns{name_clean}",
        f"trr{name_clean}",
        f"ex{name_clean}"
    ])
    
    # Set-specific keywords
    keywords.extend([
        set_code.lower(),
        "exteamrocketreturns",
        "teamrocketreturns",
        "trr",
        "exseries",
        "ex-series",
        "teamrocket",
        "darkpokemon",
        "rocketspokemon"
    ])
    
    # Card number variations
    full_number = f"{card_number}/109"
    keywords.extend([
        full_number,
        f"{set_code.lower().replace('-', '')}{card_number}",
        f"exteamrocketreturns{card_number}",
        f"trr{card_number}"
    ])
    
    # Rarity keywords
    rarity_clean = rarity.lower().replace(' ', '').replace('☆', 'star')
    keywords.extend([
        rarity_clean,
        f"ex{rarity_clean}",
        f"trr{rarity_clean}"
    ])
    
    # Type keywords
    if card_type not in ['Trainer', 'Energy']:
        keywords.append(f"{card_type.lower()}{name_clean}")
    
    # Special keywords for different card types
    if 'Dark ' in name:
        keywords.extend(['dark', 'darkpokemon'])
    if "Rocket's " in name:
        keywords.extend(['rockets', 'rocketspokemon'])
    if 'Star' in name:
        keywords.extend(['star', 'pokemonstar'])
    
    # Remove duplicates and return
    return list(set(keywords))

def generate_card_data():
    """Generate the complete card dataset"""
    
    set_info = {
        "name": "EX Team Rocket Returns",
        "description": "The seventh set in the EX Series, bringing back the villainous Team Rocket with Dark Pokémon featuring dual types. Introduces Rocket's ex cards and the first Pokémon Star cards (Mudkip, Torchic, Treecko), marking a significant expansion of the TCG universe.",
        "setCode": "ex-team-rocket-returns",
        "totalCards": 111,
        "releaseDate": "November 8, 2004",
        "tagSales": [
            "EX Team Rocket Returns",
            "Team Rocket Returns",
            "EX Series",
            "Pokemon EX",
            "Dark Pokemon",
            "Rocket's Pokemon",
            "Pokemon Star",
            "Mudkip Star",
            "Torchic Star", 
            "Treecko Star",
            "Team Rocket",
            "Dark Cards"
        ]
    }
    
    cards = []
    
    # Parse each line of card data
    for line in CARD_DATA.strip().split('\n'):
        if not line.strip():
            continue
            
        parts = [p.strip() for p in line.split('\t') if p.strip()]
        if len(parts) < 4:
            continue
            
        full_number = parts[0]
        name = parts[1]
        card_type = parts[2]
        rarity = parts[3]
        
        # Extract card number
        card_number = full_number.split('/')[0]
        
        # Parse type
        parsed_type = parse_type(card_type)
        
        # Generate card ID
        card_id = f"ex-team-rocket-returns-{card_number}"
        
        # Generate image URL
        image_url = f"https://www.serebii.net/card/exteamrocketreturns/{card_number}.jpg"
        
        # Generate matching keywords
        keywords = generate_matching_keywords(
            name, card_number, "EX Team Rocket Returns", "ex-team-rocket-returns", rarity, parsed_type
        )
        
        card = {
            "id": card_id,
            "name": name,
            "setName": "EX Team Rocket Returns",
            "setCode": "ex-team-rocket-returns", 
            "cardNumber": card_number,
            "fullNumber": full_number,
            "rarity": rarity,
            "type": parsed_type,
            "artist": "Unknown",
            "matchingKeywords": keywords,
            "imageUrl": image_url
        }
        
        # Add HP for Pokemon cards (estimated based on evolution stage and rarity)
        if parsed_type not in ['Trainer', 'Energy']:
            if 'ex' in rarity.lower():
                card["hp"] = "150"  # ex cards typically have high HP
            elif 'Star' in rarity or '☆' in rarity:
                card["hp"] = "70"   # Star cards have unique HP
            elif 'Holo' in rarity:
                card["hp"] = "90"   # Holo rares (stage 2 evolutions)
            elif rarity == 'Rare':
                card["hp"] = "80"   # Regular rares
            elif rarity == 'Uncommon':
                card["hp"] = "60"   # Uncommon evolutions
            elif rarity == 'Rare Secret':
                if 'ex' in name.lower():
                    card["hp"] = "150"
                else:
                    card["hp"] = "60"  # Secret Charmeleon
            else:
                card["hp"] = "40"   # Basic commons
        
        cards.append(card)
    
    return {
        "setInfo": set_info,
        "cards": cards
    }

def main():
    """Main function to generate and save the dataset"""
    dataset = generate_card_data()
    
    # Save to JSON file
    output_file = "data/cards/ex-team-rocket-returns.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)
    
    print(f"Generated EX Team Rocket Returns dataset with {len(dataset['cards'])} cards")
    print(f"Saved to {output_file}")

if __name__ == "__main__":
    main() 