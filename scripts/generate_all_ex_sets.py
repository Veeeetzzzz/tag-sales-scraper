#!/usr/bin/env python3

import csv
import json
import re
from datetime import datetime
import random
import os

def clean_card_name(name):
    """Clean card name for consistent formatting"""
    # Handle delta species notation
    name = re.sub(r'\s*\(delta species\)\s*', ' δ', name)
    # Handle various star notations
    name = re.sub(r'\s*\*\s*$', ' ☆', name)
    name = re.sub(r'\s*☆\s*\(delta species\)', ' δ ☆', name)
    # Clean up extra spaces
    name = re.sub(r'\s+', ' ', name).strip()
    return name

def parse_card_types(card_name, rarity):
    """Determine card types based on name and rarity"""
    name_lower = card_name.lower()
    
    # Energy cards
    if 'energy' in name_lower:
        return ["Energy"]
    
    # Trainer cards - check for common trainer keywords
    trainer_keywords = [
        'fossil', 'berry', 'ball', 'stadium', 'project', 'search', 'advice', 'training', 
        'candy', 'reversal', 'switch', 'potion', 'powder', 'orb', 'rage', 'maintenance',
        'network', 'crystal', 'shard', 'circle', 'point', 'storm', 'charm', 'piece',
        'legacy', 'mentor', 'hermit', 'reporter', 'method', 'research', 'rod', 
        'adventurer', 'discovery', 'lake', 'farmer', 'lass', 'researcher', 'tower',
        'ruins', 'scientist', 'transceiver', 'scoop', 'stone', 'flame', 'stump',
        'tree', 'cave', 'removal', 'system', 'root', 'recycle', 'castaway', 'dual',
        'nav', 'warp', 'request', 'protective', 'solid', 'cursed', 'fieldworker',
        'full', 'frontier', 'birch', 'scott', 'steven', 'glacia', 'phoebe', 'sidney',
        'drake', 'cozmo', 'elm', 'oak', 'bill', 'celio', 'copycat', 'mary',
        'lanette', 'wally', 'tv', 'mr.', 'professor', 'here comes team rocket'
    ]
    
    if any(keyword in name_lower for keyword in trainer_keywords):
        return ["Trainer"]
    
    # Fire types
    if any(fire_mon in name_lower for fire_mon in [
        'charmander', 'charmeleon', 'charizard', 'vulpix', 'ninetales', 'growlithe', 'arcanine',
        'ponyta', 'rapidash', 'magmar', 'flareon', 'cyndaquil', 'quilava', 'typhlosion',
        'slugma', 'magcargo', 'houndour', 'houndoom', 'torchic', 'combusken', 'blaziken',
        'numel', 'camerupt', 'torkoal'
    ]):
        # Check for delta species with different typing
        if 'δ' in card_name:
            if any(mon in name_lower for mon in ['charizard', 'typhlosion']):
                return ["Fire", "Metal"]  # Common delta typing
            return ["Fire"]
        return ["Fire"]
    
    # Water types
    elif any(water_mon in name_lower for water_mon in [
        'squirtle', 'wartortle', 'blastoise', 'psyduck', 'golduck', 'poliwag', 'poliwhirl',
        'poliwrath', 'tentacool', 'tentacruel', 'slowpoke', 'slowbro', 'slowking', 'seel',
        'dewgong', 'shellder', 'cloyster', 'krabby', 'kingler', 'horsea', 'seadra', 'kingdra',
        'staryu', 'starmie', 'magikarp', 'gyarados', 'lapras', 'vaporeon', 'omanyte', 'omastar',
        'kabuto', 'kabutops', 'totodile', 'croconaw', 'feraligatr', 'chinchou', 'lanturn',
        'marill', 'azumarill', 'politoed', 'wooper', 'quagsire', 'corsola', 'remoraid',
        'octillery', 'mantine', 'mudkip', 'marshtomp', 'swampert', 'wingull', 'pelipper',
        'surskit', 'carvanha', 'sharpedo', 'wailmer', 'wailord', 'barboach', 'whiscash',
        'clamperl', 'huntail', 'gorebyss', 'relicanth', 'luvdisc', 'feebas', 'milotic'
    ]):
        if 'δ' in card_name:
            if 'blastoise' in name_lower:
                return ["Water", "Metal"]
            elif 'feraligatr' in name_lower:
                return ["Lightning", "Metal"]
            elif 'gyarados' in name_lower:
                return ["Lightning", "Metal"]
            elif 'kingdra' in name_lower:
                return ["Water", "Metal"]
            elif 'starmie' in name_lower:
                return ["Psychic", "Metal"]
        return ["Water"]
    
    # Grass types
    elif any(grass_mon in name_lower for grass_mon in [
        'bulbasaur', 'ivysaur', 'venusaur', 'oddish', 'gloom', 'vileplume', 'bellsprout',
        'weepinbell', 'victreebel', 'exeggcute', 'exeggutor', 'tangela', 'chikorita',
        'bayleef', 'meganium', 'bellossom', 'sunkern', 'sunflora', 'treecko', 'grovyle',
        'sceptile', 'shroomish', 'breloom', 'lotad', 'lombre', 'ludicolo', 'seedot',
        'nuzleaf', 'shiftry', 'cacnea', 'cacturne', 'lileep', 'cradily', 'tropius',
        'roselia', 'weedle', 'kakuna', 'beedrill'
    ]):
        if 'δ' in card_name:
            if 'meganium' in name_lower:
                return ["Grass", "Metal"]
            elif 'sceptile' in name_lower:
                return ["Grass", "Metal"]
            elif 'vileplume' in name_lower:
                return ["Grass", "Metal"]
            elif 'beedrill' in name_lower:
                return ["Grass", "Metal"]
        return ["Grass"]
    
    # Lightning types
    elif any(lightning_mon in name_lower for lightning_mon in [
        'pikachu', 'raichu', 'magnemite', 'magneton', 'voltorb', 'electrode', 'electabuzz',
        'jolteon', 'zapdos', 'mareep', 'flaaffy', 'ampharos', 'elekid', 'raikou',
        'electrike', 'manectric', 'plusle', 'minun'
    ]):
        if 'δ' in card_name:
            if 'ampharos' in name_lower:
                return ["Lightning", "Metal"]
        return ["Lightning"]
    
    # Psychic types
    elif any(psychic_mon in name_lower for psychic_mon in [
        'abra', 'kadabra', 'alakazam', 'slowpoke', 'slowbro', 'slowking', 'drowzee', 'hypno',
        'mr. mime', 'jynx', 'mew', 'mewtwo', 'espeon', 'unown', 'wobbuffet', 'girafarig',
        'dunsparce', 'smoochum', 'celebi', 'ralts', 'kirlia', 'gardevoir', 'meditite',
        'medicham', 'spoink', 'grumpig', 'lunatone', 'solrock', 'baltoy', 'claydol', 
        'chimecho', 'jirachi', 'deoxys', 'beldum', 'metang', 'metagross', 'gastly',
        'haunter', 'gengar', 'misdreavus', 'shuppet', 'banette', 'duskull', 'dusclops'
    ]):
        if 'δ' in card_name:
            if 'gardevoir' in name_lower:
                return ["Psychic", "Metal"]
            elif 'mewtwo' in name_lower:
                return ["Psychic", "Metal"]
            elif 'metagross' in name_lower:
                return ["Psychic", "Metal"]
        return ["Psychic"]
    
    # Fighting types
    elif any(fighting_mon in name_lower for fighting_mon in [
        'mankey', 'primeape', 'machop', 'machoke', 'machamp', 'geodude', 'graveler', 'golem',
        'onix', 'cubone', 'marowak', 'hitmonlee', 'hitmonchan', 'rhyhorn', 'rhydon',
        'sandshrew', 'sandslash', 'diglett', 'dugtrio', 'tyrogue', 'hitmontop', 'larvitar',
        'pupitar', 'tyranitar', 'makuhita', 'hariyama', 'nosepass', 'mawile', 'aron',
        'lairon', 'aggron', 'regice', 'regirock', 'registeel', 'anorith', 'armaldo',
        'phanpy', 'donphan', 'steelix', 'skarmory', 'nidoran', 'nidorina', 'nidorino',
        'nidoqueen', 'nidoking'
    ]):
        if 'δ' in card_name:
            if 'tyranitar' in name_lower:
                return ["Fighting", "Metal"]
            elif 'marowak' in name_lower:
                return ["Fighting", "Lightning"]
            elif any(mon in name_lower for mon in ['nidoking', 'nidoqueen']):
                return ["Fighting", "Metal"]
        return ["Fighting"]
    
    # Dragon types
    elif any(dragon_mon in name_lower for dragon_mon in [
        'dratini', 'dragonair', 'dragonite', 'kingdra', 'vibrava', 'flygon', 'altaria',
        'bagon', 'shelgon', 'salamence', 'latias', 'latios', 'rayquaza'
    ]):
        if 'δ' in card_name:
            return ["Metal"]  # Delta species dragons often become Metal
        return ["Dragon"]
    
    # Metal types
    elif any(metal_mon in name_lower for metal_mon in [
        'magnemite', 'magneton', 'skarmory', 'forretress', 'steelix', 'beldum', 'metang',
        'metagross', 'registeel', 'aron', 'lairon', 'aggron', 'mawile'
    ]):
        return ["Metal"]
    
    # Darkness types
    elif 'dark' in name_lower or any(dark_mon in name_lower for dark_mon in [
        'sableye', 'absol', 'mightyena', 'poochyena', 'murkrow'
    ]):
        return ["Darkness"]
    
    # Colorless/Normal types (catch-all)
    else:
        if 'δ' in card_name:
            return ["Metal"]  # Many delta species become Metal
        return ["Colorless"]

def estimate_hp(card_name, rarity):
    """Estimate HP based on card name and rarity"""
    name_lower = card_name.lower()
    
    # Energy and Trainer cards don't have HP
    if any(keyword in name_lower for keyword in ['energy', 'fossil', 'berry', 'ball', 'stadium']):
        return None
    
    # Check for trainer card keywords
    trainer_keywords = [
        'project', 'search', 'advice', 'training', 'candy', 'reversal', 'switch', 'potion',
        'maintenance', 'network', 'crystal', 'point', 'charm', 'legacy', 'mentor', 'method',
        'research', 'discovery', 'farmer', 'scientist', 'removal', 'system', 'birch', 'scott'
    ]
    if any(keyword in name_lower for keyword in trainer_keywords):
        return None
    
    # Pokémon Star cards typically have 70 HP
    if '☆' in card_name or '*' in card_name:
        return 70
    
    # EX cards typically have high HP
    if 'ex' in rarity.lower():
        # Basic ex cards
        if any(basic in name_lower for basic in [
            'mewtwo', 'mew', 'deoxys', 'jirachi', 'celebi', 'ho-oh', 'lugia', 'groudon', 'kyogre',
            'rayquaza', 'latias', 'latios', 'regice', 'regirock', 'registeel'
        ]):
            return 100
        # Stage 2 ex cards
        elif any(stage2 in name_lower for stage2 in [
            'charizard', 'blastoise', 'venusaur', 'alakazam', 'machamp', 'golem', 'gengar',
            'meganium', 'typhlosion', 'feraligatr', 'ampharos', 'tyranitar', 'blaziken',
            'sceptile', 'swampert', 'gardevoir', 'aggron', 'salamence', 'metagross', 'flygon'
        ]):
            return 150
        # Stage 1 ex cards
        else:
            return 120
    
    # Regular Pokémon HP estimation
    # Baby Pokémon
    if any(baby in name_lower for baby in [
        'pichu', 'cleffa', 'igglybuff', 'tyrogue', 'smoochum', 'elekid', 'magby', 'wynaut',
        'azurill'
    ]):
        return 30
    
    # Basic Pokémon
    elif any(basic in name_lower for basic in [
        'bulbasaur', 'charmander', 'squirtle', 'pikachu', 'chikorita', 'cyndaquil', 'totodile',
        'treecko', 'torchic', 'mudkip'
    ]):
        return random.choice([40, 50, 60])
    
    # Stage 1 Pokémon
    elif any(stage1 in name_lower for stage1 in [
        'ivysaur', 'charmeleon', 'wartortle', 'raichu'
    ]):
        return random.choice([60, 70, 80])
    
    # Stage 2 Pokémon
    elif any(stage2 in name_lower for stage2 in [
        'venusaur', 'charizard', 'blastoise'
    ]):
        return random.choice([90, 100, 110, 120])
    
    # Legendary Pokémon
    elif any(legendary in name_lower for legendary in [
        'articuno', 'zapdos', 'moltres', 'mew', 'mewtwo', 'raikou', 'entei', 'suicune',
        'lugia', 'ho-oh', 'celebi', 'kyogre', 'groudon', 'rayquaza', 'jirachi', 'deoxys',
        'latias', 'latios', 'regice', 'regirock', 'registeel'
    ]):
        return random.choice([80, 90, 100])
    
    # Default HP for unknown Pokémon
    return random.choice([50, 60, 70])

def generate_keywords(card_name, set_name):
    """Generate matching keywords for card search"""
    keywords = []
    
    # Add the card name itself (cleaned)
    clean_name = re.sub(r'[^\w\s]', '', card_name.lower())
    keywords.extend(clean_name.split())
    
    # Add set-specific keywords
    keywords.extend(['ex', 'pokemon', 'tcg', 'card'])
    
    # Add delta species keywords
    if 'δ' in card_name:
        keywords.extend(['delta', 'species'])
    
    # Add star keywords
    if '☆' in card_name or '*' in card_name:
        keywords.extend(['star', 'shining'])
    
    # Remove duplicates and filter out short words
    keywords = list(set([k for k in keywords if len(k) > 2]))
    
    return keywords

def generate_set_json(csv_file, set_info):
    """Generate JSON dataset from CSV file"""
    cards = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            card_name = clean_card_name(row['card_name'])
            card_number = str(row['card_number'])
            rarity = row['rarity']
            
            # Create full card number (for secret rares, etc.)
            total_cards = set_info['total_cards']
            if card_number.isdigit():
                full_number = f"{card_number}/{total_cards}"
            else:
                # Handle special numbering like A, B, C, etc.
                full_number = f"{card_number}/{total_cards}"
            
            # Determine types
            card_types = parse_card_types(card_name, rarity)
            
            # Estimate HP (only for Pokémon)
            hp = None
            if card_types and card_types[0] not in ["Energy", "Trainer"]:
                hp = estimate_hp(card_name, rarity)
            
            # Generate image URL
            image_url = f"https://www.serebii.net/card/{set_info['image_path']}/{card_number.lower()}.jpg"
            
            card_data = {
                "id": f"{set_info['set_code'].lower()}-{card_number}",
                "name": card_name,
                "setName": set_info['name'],
                "setCode": set_info['set_code'],
                "cardNumber": card_number,
                "fullNumber": full_number,
                "rarity": rarity,
                "type": card_types,
                "artist": "Unknown",
                "matchingKeywords": generate_keywords(card_name, set_info['name']),
                "imageUrl": image_url
            }
            
            if hp is not None:
                card_data["hp"] = hp
            
            cards.append(card_data)
    
    # Create final dataset
    dataset = {
        "setName": set_info['name'],
        "description": set_info['description'],
        "releaseDate": set_info['release_date'],
        "totalCards": set_info['total_cards'],
        "tagSales": True,
        "cards": cards
    }
    
    return dataset

# Set information for all 8 sets
sets_info = {
    'ex_power_keepers': {
        'name': 'EX Power Keepers',
        'set_code': 'PK',
        'description': 'The final set of the EX Series, featuring Pokémon-ex and the Eeveelution Star cards. Known for its Elite Four themed stadiums and final appearances of classic EX mechanics.',
        'release_date': '2007-02-14',
        'total_cards': '108',
        'image_path': 'expowerkeepers'
    },
    'ex_dragon_frontiers': {
        'name': 'EX Dragon Frontiers',
        'set_code': 'DF',
        'description': 'Features Delta Species Pokémon with Metal typing and includes the legendary Charizard Star and Mew Star cards. Focuses on Dragon-type and Metal-type Delta Species.',
        'release_date': '2006-11-08',
        'total_cards': '101',
        'image_path': 'exdragonfrontiers'
    },
    'ex_crystal_guardians': {
        'name': 'EX Crystal Guardians',
        'set_code': 'CG',
        'description': 'Introduces Crystal-themed Trainer cards and features both regular and Delta Species Pokémon. Notable for Alakazam Star and Celebi Star cards.',
        'release_date': '2006-08-30',
        'total_cards': '100',
        'image_path': 'excrystalguardians'
    },
    'ex_holon_phantoms': {
        'name': 'EX Holon Phantoms',
        'set_code': 'HP',
        'description': 'Set in the mysterious Holon region featuring Delta Species Pokémon and multiple Deoxys forms. Includes Gyarados Star, Mewtwo Star, and Pikachu Star, plus a secret Mew card.',
        'release_date': '2006-05-03',
        'total_cards': '110',
        'image_path': 'exholonphantoms'
    },
    'ex_legend_maker': {
        'name': 'EX Legend Maker',
        'set_code': 'LM',
        'description': 'Features the legendary Regi trio as Star cards and includes unique Location cards. Notable for its focus on Hoenn legendary Pokémon and the secret Pikachu Delta Species.',
        'release_date': '2006-02-13',
        'total_cards': '92',
        'image_path': 'exlegendmaker'
    },
    'ex_delta_species': {
        'name': 'EX Delta Species',
        'set_code': 'DS',
        'description': 'The original Delta Species set introducing Pokémon with unusual type combinations. Features the weather legendary trio as Star cards and Holon Energy cards.',
        'release_date': '2005-10-31',
        'total_cards': '113',
        'image_path': 'exdeltaspecies'
    },
    'ex_unseen_forces': {
        'name': 'EX Unseen Forces',
        'set_code': 'UF',
        'description': 'A Johto-focused set featuring the legendary beast trio as Star cards and the unique Unown alphabet cards (A-Z, ?, !). Includes two secret rare cards.',
        'release_date': '2005-08-22',
        'total_cards': '115',
        'image_path': 'exunseenforces'
    },
    'ex_emerald': {
        'name': 'EX Emerald',
        'set_code': 'EM',
        'description': 'Based on Pokémon Emerald featuring Hoenn Pokémon and the Battle Frontier. Notable for its special Rare Holo Energy cards and the secret Farfetch\'d card.',
        'release_date': '2005-05-09',
        'total_cards': '106',
        'image_path': 'exemerald'
    }
}

def main():
    """Generate all 8 EX series datasets"""
    csv_files = [
        'ex_power_keepers_set_list.csv',
        'ex_dragon_frontiers_set_list.csv', 
        'ex_crystal_guardians_set_list.csv',
        'ex_holon_phantoms_set_list.csv',
        'ex_legend_maker_set_list.csv',
        'ex_delta_species_set_list.csv',
        'ex_unseen_forces_set_list.csv',
        'ex_emerald_set_list.csv'
    ]
    
    for csv_file in csv_files:
        set_key = csv_file.replace('_set_list.csv', '')
        print(f"Processing {csv_file}...")
        
        try:
            # Generate dataset
            dataset = generate_set_json(f'data/cards/to-import/{csv_file}', sets_info[set_key])
            
            # Save to JSON file
            output_file = f'data/cards/{set_key.replace("_", "-")}.json'
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(dataset, f, indent=2, ensure_ascii=False)
            
            print(f"✓ Generated {output_file} with {len(dataset['cards'])} cards")
            
        except Exception as e:
            print(f"✗ Error processing {csv_file}: {str(e)}")

if __name__ == "__main__":
    main() 