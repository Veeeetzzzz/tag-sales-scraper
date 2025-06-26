#!/usr/bin/env python3
"""
Script to generate EX FireRed & LeafGreen card dataset.
"""

import json
import re

# Card data from the user
CARD_DATA = """
1/112 	Beedrill 	Grass 	Rare Holo
2/112 	Butterfree 	Grass 	Rare Holo
3/112 	Dewgong 	Water 	Rare Holo
4/112 	Ditto 	Colorless 	Rare Holo
5/112 	Exeggutor 	Psychic 	Rare Holo
6/112 	Kangaskhan 	Colorless 	Rare Holo
7/112 	Marowak 	Fighting 	Rare Holo
8/112 	Nidoking 	Fighting 	Rare Holo
9/112 	Nidoqueen 	Fighting 	Rare Holo
10/112 	Pidgeot 	Colorless 	Rare Holo
11/112 	Poliwrath 	Water 	Rare Holo
12/112 	Raichu 	Lightning 	Rare Holo
13/112 	Rapidash 	Fire 	Rare Holo
14/112 	Slowbro 	Psychic 	Rare Holo
15/112 	Snorlax 	Colorless 	Rare Holo
16/112 	Tauros 	Colorless 	Rare Holo
17/112 	Victreebel 	Grass 	Rare Holo
18/112 	Arcanine 	Fire 	Rare
19/112 	Chansey 	Colorless 	Rare
20/112 	Cloyster 	Water 	Rare
21/112 	Dodrio 	Colorless 	Rare
22/112 	Dugtrio 	Fighting 	Rare
23/112 	Farfetch'd 	Colorless 	Rare
24/112 	Fearow 	Colorless 	Rare
25/112 	Hypno 	Psychic 	Rare
26/112 	Kingler 	Water 	Rare
27/112 	Magneton 	Lightning 	Rare
28/112 	Primeape 	Fighting 	Rare
29/112 	Scyther 	Grass 	Rare
30/112 	Tangela 	Grass 	Rare
31/112 	Charmeleon 	Fire 	Uncommon
32/112 	Drowzee 	Psychic 	Uncommon
33/112 	Exeggcute 	Psychic 	Uncommon
34/112 	Haunter 	Psychic 	Uncommon
35/112 	Ivysaur 	Grass 	Uncommon
36/112 	Kakuna 	Grass 	Uncommon
37/112 	Lickitung 	Colorless 	Uncommon
38/112 	Mankey 	Fighting 	Uncommon
39/112 	Metapod 	Grass 	Uncommon
40/112 	Nidorina 	Grass 	Uncommon
41/112 	Nidorino 	Grass 	Uncommon
42/112 	Onix 	Fighting 	Uncommon
43/112 	Parasect 	Grass 	Uncommon
44/112 	Persian 	Colorless 	Uncommon
45/112 	Pidgeotto 	Colorless 	Uncommon
46/112 	Poliwhirl 	Water 	Uncommon
47/112 	Porygon 	Colorless 	Uncommon
48/112 	Raticate 	Colorless 	Uncommon
49/112 	Venomoth 	Grass 	Uncommon
50/112 	Wartortle 	Water 	Uncommon
51/112 	Weepinbell 	Grass 	Uncommon
52/112 	Wigglytuff 	Colorless 	Uncommon
53/112 	Bellsprout 	Grass 	Common
54/112 	Bulbasaur 	Grass 	Common
55/112 	Bulbasaur 	Grass 	Common
56/112 	Caterpie 	Grass 	Common
57/112 	Charmander 	Fire 	Common
58/112 	Charmander 	Fire 	Common
59/112 	Clefairy 	Colorless 	Common
60/112 	Cubone 	Fighting 	Common
61/112 	Diglett 	Fighting 	Common
62/112 	Doduo 	Colorless 	Common
63/112 	Gastly 	Psychic 	Common
64/112 	Growlithe 	Fire 	Common
65/112 	Jigglypuff 	Colorless 	Common
66/112 	Krabby 	Water 	Common
67/112 	Magikarp 	Water 	Common
68/112 	Magnemite 	Lightning 	Common
69/112 	Meowth 	Colorless 	Common
70/112 	Nidoran♀ 	Grass 	Common
71/112 	Nidoran♂ 	Grass 	Common
72/112 	Paras 	Grass 	Common
73/112 	Pidgey 	Colorless 	Common
74/112 	Pikachu 	Lightning 	Common
75/112 	Poliwag 	Water 	Common
76/112 	Ponyta 	Fire 	Common
77/112 	Rattata 	Colorless 	Common
78/112 	Seel 	Water 	Common
79/112 	Shellder 	Water 	Common
80/112 	Slowpoke 	Psychic 	Common
81/112 	Spearow 	Colorless 	Common
82/112 	Squirtle 	Water 	Common
83/112 	Squirtle 	Water 	Common
84/112 	Venonat 	Grass 	Common
85/112 	Voltorb 	Lightning 	Common
86/112 	Weedle 	Grass 	Common
87/112 	Bill's Maintenance 	T [Su] 	Uncommon
88/112 	Celio's Network 	T [Su] 	Uncommon
89/112 	Energy Removal 2 	T 	Uncommon
90/112 	Energy Switch 	T 	Uncommon
91/112 	EXP.ALL 	T [PT] 	Uncommon
92/112 	Great Ball 	T 	Uncommon
93/112 	Life Herb 	T 	Uncommon
94/112 	Mt. Moon 	T [St] 	Uncommon
95/112 	Poké Ball 	T 	Uncommon
96/112 	PokéDex HANDY909 	T 	Uncommon
97/112 	Pokémon Reversal 	T 	Uncommon
98/112 	Prof. Oak's Research 	T [Su] 	Uncommon
99/112 	Super Scoop Up 	T 	Uncommon
100/112 	VS Seeker 	T 	Uncommon
101/112 	Potion 	T 	Common
102/112 	Switch 	T 	Common
103/112 	Multi Energy 	Rainbow E 	Rare
104/112 	Blastoise ex 	Water 	Rare Holo ex
105/112 	Charizard ex 	Fire 	Rare Holo ex
106/112 	Clefable ex 	Colorless 	Rare Holo ex
107/112 	Electrode ex 	Lightning 	Rare Holo ex
108/112 	Gengar ex 	Psychic 	Rare Holo ex
109/112 	Gyarados ex 	Water 	Rare Holo ex
110/112 	Mr. Mime ex 	Psychic 	Rare Holo ex
111/112 	Mr. Mime ex 	Psychic 	Rare Holo ex
112/112 	Venusaur ex 	Grass 	Rare Holo ex
113/112 	Charmander 	Fire 	Rare Secret
114/112 	Articuno ex 	Water 	Rare Secret
115/112 	Moltres ex 	Fire 	Rare Secret
116/112 	Zapdos ex 	Lightning 	Rare Secret
"""

def parse_type(type_str):
    """Parse the type string to handle special types"""
    if type_str.startswith('T '):
        return 'Trainer'
    elif type_str == 'Rainbow E':
        return 'Energy'
    else:
        return type_str

def clean_name(name):
    """Clean card name for keyword generation"""
    # Handle special characters
    name = name.replace('♀', 'f').replace('♂', 'm')
    name = name.replace("'", '').replace('.', '').replace(' ', '').lower()
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
        f"fireredleafgreen{name_clean}",
        f"ex{name_clean}"
    ])
    
    # Set-specific keywords
    keywords.extend([
        set_code.lower(),
        "exfireredleafgreen",
        "fireredleafgreen",
        "exseries",
        "ex-series",
        "gen1",
        "generation1",
        "kanto",
        "frlg"
    ])
    
    # Card number variations
    full_number = f"{card_number}/112"
    keywords.extend([
        full_number,
        f"{set_code.lower().replace('-', '')}{card_number}",
        f"exfireredleafgreen{card_number}",
        f"frlg{card_number}"
    ])
    
    # Rarity keywords
    rarity_clean = rarity.lower().replace(' ', '')
    keywords.extend([
        rarity_clean,
        f"ex{rarity_clean}",
        f"frlg{rarity_clean}"
    ])
    
    # Type keywords
    if card_type not in ['Trainer', 'Energy']:
        keywords.append(f"{card_type.lower()}{name_clean}")
    
    # Remove duplicates and return
    return list(set(keywords))

def generate_card_data():
    """Generate the complete card dataset"""
    
    set_info = {
        "name": "EX FireRed & LeafGreen",
        "description": "The sixth set in the EX Series, reimagining the original Kanto region cards from Red and Blue versions. Features classic Generation I Pokémon with updated artwork and mechanics, including iconic starters Charizard, Blastoise, and Venusaur as powerful ex cards.",
        "setCode": "ex-firered-leafgreen",
        "totalCards": 116,
        "releaseDate": "August 30, 2004",
        "tagSales": [
            "EX FireRed LeafGreen",
            "FireRed LeafGreen",
            "EX Series",
            "Pokemon EX",
            "Generation 1",
            "Kanto Pokemon",
            "Charizard ex",
            "Blastoise ex",
            "Venusaur ex",
            "Legendary Birds",
            "Articuno ex",
            "Moltres ex",
            "Zapdos ex"
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
        card_id = f"ex-firered-leafgreen-{card_number}"
        
        # Generate image URL
        image_url = f"https://www.serebii.net/card/exfireredandleafgreen/{card_number}.jpg"
        
        # Generate matching keywords
        keywords = generate_matching_keywords(
            name, card_number, "EX FireRed & LeafGreen", "ex-firered-leafgreen", rarity, parsed_type
        )
        
        card = {
            "id": card_id,
            "name": name,
            "setName": "EX FireRed & LeafGreen",
            "setCode": "ex-firered-leafgreen", 
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
            elif 'Holo' in rarity:
                card["hp"] = "90"   # Holo rares (stage 2 evolutions)
            elif rarity == 'Rare':
                card["hp"] = "80"   # Regular rares
            elif rarity == 'Uncommon':
                card["hp"] = "60"   # Uncommon evolutions
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
    output_file = "data/cards/ex-firered-leafgreen.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)
    
    print(f"Generated EX FireRed & LeafGreen dataset with {len(dataset['cards'])} cards")
    print(f"Saved to {output_file}")

if __name__ == "__main__":
    main() 