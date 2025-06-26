#!/usr/bin/env python3
"""
Script to generate EX Hidden Legends card dataset.
"""

import json
import re

# Card data from the user
CARD_DATA = """
1/101 	Banette 	Psychic 	Rare Holo
2/101 	Claydol 	Psychic 	Rare Holo
3/101 	Crobat 	Grass 	Rare Holo
4/101 	Dark Celebi 	GrassDarkness 	Rare Holo
5/101 	Electrode 	Lightning 	Rare Holo
6/101 	Exploud 	Colorless 	Rare Holo
7/101 	Heracross 	Grass 	Rare Holo
8/101 	Jirachi 	PsychicMetal 	Rare Holo
9/101 	Machamp 	Fighting 	Rare Holo
10/101 	Medicham 	Fighting 	Rare Holo
11/101 	Metagross 	PsychicMetal 	Rare Holo
12/101 	Milotic 	Water 	Rare Holo
13/101 	Pinsir 	Grass 	Rare Holo
14/101 	Shiftry 	Darkness 	Rare Holo
15/101 	Walrein 	Water 	Rare Holo
16/101 	Bellossom 	Grass 	Rare
17/101 	Chimecho 	Psychic 	Rare
18/101 	Gorebyss 	Water 	Rare
19/101 	Huntail 	Water 	Rare
20/101 	Masquerain 	Grass 	Rare
21/101 	Metang 	Metal 	Rare
22/101 	Ninetales 	Fire 	Rare
23/101 	Rain Castform 	Water 	Rare
24/101 	Relicanth 	Water 	Rare
25/101 	Snow-cloud Castform 	Water 	Rare
26/101 	Sunny Castform 	Fire 	Rare
27/101 	Tropius 	Grass 	Rare
28/101 	Beldum 	Metal 	Uncommon
29/101 	Beldum 	Metal 	Uncommon
30/101 	Castform 	Colorless 	Uncommon
31/101 	Claydol 	Fighting 	Uncommon
32/101 	Corsola 	Water 	Uncommon
33/101 	Dodrio 	Colorless 	Uncommon
34/101 	Glalie 	Water 	Uncommon
35/101 	Gloom 	Grass 	Uncommon
36/101 	Golbat 	Grass 	Uncommon
37/101 	Igglybuff 	Colorless 	Uncommon
38/101 	Lanturn 	Lightning 	Uncommon
39/101 	Loudred 	Colorless 	Uncommon
40/101 	Luvdisc 	Water 	Uncommon
41/101 	Machoke 	Fighting 	Uncommon
42/101 	Medicham 	Fighting 	Uncommon
43/101 	Metang 	Psychic 	Uncommon
44/101 	Metang 	Metal 	Uncommon
45/101 	Nuzleaf 	Darkness 	Uncommon
46/101 	Rhydon 	Fighting 	Uncommon
47/101 	Sealeo 	Water 	Uncommon
48/101 	Spinda 	Colorless 	Uncommon
49/101 	Starmie 	Psychic 	Uncommon
50/101 	Swalot 	Grass 	Uncommon
51/101 	Tentacruel 	Water 	Uncommon
52/101 	Baltoy 	Psychic 	Common
53/101 	Baltoy 	Fighting 	Common
54/101 	Beldum 	Psychic 	Common
55/101 	Chikorita 	Grass 	Common
56/101 	Chinchou 	Lightning 	Common
57/101 	Chinchou 	Lightning 	Common
58/101 	Clamperl 	Water 	Common
59/101 	Cyndaquil 	Fire 	Common
60/101 	Doduo 	Colorless 	Common
61/101 	Feebas 	Water 	Common
62/101 	Gulpin 	Grass 	Common
63/101 	Jigglypuff 	Colorless 	Common
64/101 	Machop 	Fighting 	Common
65/101 	Meditite 	Psychic 	Common
66/101 	Meditite 	Fighting 	Common
67/101 	Minun 	Lightning 	Common
68/101 	Oddish 	Grass 	Common
69/101 	Plusle 	Lightning 	Common
70/101 	Rhyhorn 	Fighting 	Common
71/101 	Seedot 	Grass 	Common
72/101 	Shuppet 	Psychic 	Common
73/101 	Snorunt 	Water 	Common
74/101 	Spheal 	Water 	Common
75/101 	Staryu 	Water 	Common
76/101 	Surskit 	Grass 	Common
77/101 	Tentacool 	Water 	Common
78/101 	Togepi 	Colorless 	Common
79/101 	Totodile 	Water 	Common
80/101 	Voltorb 	Lightning 	Common
81/101 	Vulpix 	Fire 	Common
82/101 	Whismur 	Colorless 	Common
83/101 	Zubat 	Grass 	Common
84/101 	Ancient Technical Machine [Ice] 	T [TM] 	Uncommon
85/101 	Ancient Technical Machine [Rock] 	T [TM] 	Uncommon
86/101 	Ancient Technical Machine [Steel] 	T [TM] 	Uncommon
87/101 	Ancient Tomb 	T [St] 	Uncommon
88/101 	Desert Ruins 	T [St] 	Uncommon
89/101 	Island Cave 	T [St] 	Uncommon
90/101 	Life Herb 	T 	Uncommon
91/101 	Magnetic Storm 	T [St] 	Uncommon
92/101 	Steven's Advice 	T [Su] 	Uncommon
93/101 	Groudon ex 	Fighting 	Rare Holo ex
94/101 	Kyogre ex 	Water 	Rare Holo ex
95/101 	Metagross ex 	Metal 	Rare Holo ex
96/101 	Ninetales ex 	Fire 	Rare Holo ex
97/101 	Regice ex 	Water 	Rare Holo ex
98/101 	Regirock ex 	Fighting 	Rare Holo ex
99/101 	Registeel ex 	Metal 	Rare Holo ex
100/101 	Vileplume ex 	Grass 	Rare Holo ex
101/101 	Wigglytuff ex 	Colorless 	Rare Holo ex
102/101 	Groudon 	Fighting 	Rare Secret
"""

def parse_type(type_str):
    """Parse the type string to handle dual types"""
    if 'GrassDarkness' in type_str:
        return 'Grass'  # Primary type for dual types
    elif 'PsychicMetal' in type_str:
        return 'Psychic'  # Primary type for dual types
    elif type_str.startswith('T '):
        return 'Trainer'
    else:
        return type_str

def generate_matching_keywords(name, card_number, set_name, set_code, rarity, card_type):
    """Generate matching keywords for the card"""
    keywords = []
    
    # Basic name variations
    name_clean = name.lower().replace(' ', '').replace('-', '').replace("'", "")
    keywords.extend([
        name,
        name_clean,
        f"{set_code.lower()}{name_clean}",
        f"{set_name.lower().replace(' ', '')}{name_clean}",
        f"ex{name_clean}" if 'ex' in set_code.lower() else name_clean
    ])
    
    # Set-specific keywords
    keywords.extend([
        set_code.lower(),
        set_name.lower().replace(' ', ''),
        "exhiddenlegends",
        "hiddenlegends",
        "exseries",
        "ex-series",
        "gen3",
        "generation3",
        "hoenn"
    ])
    
    # Card number variations
    keywords.extend([
        f"{card_number}/101",
        f"{set_code.lower()}{card_number}",
        f"{set_code.lower()}-{card_number}",
        f"exhiddenlegends{card_number}"
    ])
    
    # Rarity keywords
    rarity_clean = rarity.lower().replace(' ', '')
    keywords.extend([
        rarity_clean,
        f"{set_code.lower()}{rarity_clean}",
        f"ex{rarity_clean}"
    ])
    
    # Type keywords
    if card_type != 'Trainer':
        keywords.append(f"{card_type.lower()}{name_clean}")
    
    # Remove duplicates and return
    return list(set(keywords))

def generate_card_data():
    """Generate the complete card dataset"""
    
    set_info = {
        "name": "EX Hidden Legends",
        "description": "The fifth set in the EX Series, featuring legendary and mythical Pokémon from the Hoenn region. Introduces ancient Pokémon and technical machines, along with powerful Pokémon-ex cards including Groudon, Kyogre, and the Legendary Golems.",
        "setCode": "ex-hidden-legends",
        "totalCards": 102,
        "releaseDate": "June 14, 2004",
        "tagSales": [
            "EX Hidden Legends",
            "Hidden Legends", 
            "EX Series",
            "Pokemon EX",
            "Legendary Pokemon",
            "Ancient Pokemon",
            "Groudon ex",
            "Kyogre ex",
            "Regice ex",
            "Regirock ex", 
            "Registeel ex",
            "Metagross ex",
            "Jirachi",
            "Generation 3"
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
        card_id = f"ex-hidden-legends-{card_number}"
        
        # Generate image URL
        image_url = f"https://www.serebii.net/card/exhiddenlegends/{card_number}.jpg"
        
        # Generate matching keywords
        keywords = generate_matching_keywords(
            name, card_number, "EX Hidden Legends", "ex-hidden-legends", rarity, parsed_type
        )
        
        card = {
            "id": card_id,
            "name": name,
            "setName": "EX Hidden Legends",
            "setCode": "ex-hidden-legends", 
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
            elif 'Holo' in rarity and card_number in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15']:
                card["hp"] = "90"   # Stage 2 holos
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
    output_file = "data/cards/ex-hidden-legends.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)
    
    print(f"Generated EX Hidden Legends dataset with {len(dataset['cards'])} cards")
    print(f"Saved to {output_file}")

if __name__ == "__main__":
    main() 