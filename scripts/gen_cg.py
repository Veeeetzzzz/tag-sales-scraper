import csv
import json
import re
import random

def clean_card_name(name):
    name = re.sub(r'\s*\(delta species\)\s*', ' δ', name)
    name = re.sub(r'\s*\*\s*$', ' ☆', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name

def parse_card_types(card_name, rarity):
    name_lower = card_name.lower()
    
    if 'energy' in name_lower:
        return ["Energy"]
    
    trainer_keywords = [
        'fossil', 'berry', 'ball', 'stadium', 'project', 'search', 'advice', 'training', 
        'candy', 'reversal', 'switch', 'potion', 'maintenance', 'network', 'crystal', 
        'point', 'charm', 'legacy', 'mentor', 'method', 'research', 'discovery', 
        'farmer', 'scientist', 'removal', 'system', 'birch', 'scott', 'steven',
        'castaway', 'celio', 'cessation', 'beach', 'shard', 'heal', 'dual',
        'circle', 'berry', 'mysterious', 'poke', 'nav', 'warp', 'windstorm'
    ]
    
    if any(keyword in name_lower for keyword in trainer_keywords):
        return ["Trainer"]
    
    # Delta species special typing
    if 'δ' in card_name or 'delta species' in name_lower:
        if 'charizard' in name_lower:
            return ["Fire", "Metal"]
        elif 'blastoise' in name_lower:
            return ["Water", "Metal"]
        elif 'ludicolo' in name_lower:
            return ["Grass", "Metal"]
        elif 'cacturne' in name_lower:
            return ["Grass", "Metal"]
        elif 'fearow' in name_lower:
            return ["Metal"]
        elif 'grovyle' in name_lower:
            return ["Grass", "Metal"]
        elif 'kingler' in name_lower:
            return ["Water", "Metal"]
        elif 'pelipper' in name_lower:
            return ["Water", "Metal"]
        else:
            return ["Metal"]  # Default for delta species
    
    # Fire types
    fire_mons = ['charmander', 'charmeleon', 'charizard', 'vulpix', 'ninetales', 'growlithe', 'arcanine', 'ponyta', 'rapidash', 'magmar', 'flareon', 'cyndaquil', 'quilava', 'typhlosion', 'slugma', 'magcargo', 'houndour', 'houndoom', 'torchic', 'combusken', 'blaziken', 'numel', 'camerupt', 'torkoal']
    if any(mon in name_lower for mon in fire_mons):
        return ["Fire"]
    
    # Water types  
    water_mons = ['squirtle', 'wartortle', 'blastoise', 'psyduck', 'golduck', 'poliwag', 'poliwhirl', 'poliwrath', 'tentacool', 'tentacruel', 'slowpoke', 'slowbro', 'slowking', 'seel', 'dewgong', 'shellder', 'cloyster', 'krabby', 'kingler', 'horsea', 'seadra', 'kingdra', 'staryu', 'starmie', 'magikarp', 'gyarados', 'lapras', 'vaporeon', 'omanyte', 'omastar', 'kabuto', 'kabutops', 'totodile', 'croconaw', 'feraligatr', 'chinchou', 'lanturn', 'marill', 'azumarill', 'politoed', 'wooper', 'quagsire', 'corsola', 'remoraid', 'octillery', 'mantine', 'mudkip', 'marshtomp', 'swampert', 'wingull', 'pelipper', 'surskit', 'carvanha', 'sharpedo', 'wailmer', 'wailord', 'barboach', 'whiscash', 'clamperl', 'huntail', 'gorebyss', 'relicanth', 'luvdisc', 'feebas', 'milotic']
    if any(mon in name_lower for mon in water_mons):
        return ["Water"]
    
    # Grass types
    grass_mons = ['bulbasaur', 'ivysaur', 'venusaur', 'oddish', 'gloom', 'vileplume', 'bellsprout', 'weepinbell', 'victreebel', 'exeggcute', 'exeggutor', 'tangela', 'chikorita', 'bayleef', 'meganium', 'bellossom', 'sunkern', 'sunflora', 'treecko', 'grovyle', 'sceptile', 'shroomish', 'breloom', 'lotad', 'lombre', 'ludicolo', 'seedot', 'nuzleaf', 'shiftry', 'cacnea', 'cacturne', 'lileep', 'cradily', 'tropius', 'roselia', 'weedle', 'kakuna', 'beedrill']
    if any(mon in name_lower for mon in grass_mons):
        return ["Grass"]
    
    # Lightning types
    lightning_mons = ['pikachu', 'raichu', 'magnemite', 'magneton', 'voltorb', 'electrode', 'electabuzz', 'jolteon', 'zapdos', 'mareep', 'flaaffy', 'ampharos', 'elekid', 'raikou', 'electrike', 'manectric', 'plusle', 'minun']
    if any(mon in name_lower for mon in lightning_mons):
        return ["Lightning"]
    
    # Psychic types
    psychic_mons = ['abra', 'kadabra', 'alakazam', 'slowpoke', 'slowbro', 'slowking', 'drowzee', 'hypno', 'jynx', 'mew', 'mewtwo', 'espeon', 'unown', 'wobbuffet', 'girafarig', 'dunsparce', 'smoochum', 'celebi', 'ralts', 'kirlia', 'gardevoir', 'meditite', 'medicham', 'spoink', 'grumpig', 'lunatone', 'solrock', 'baltoy', 'claydol', 'chimecho', 'jirachi', 'deoxys', 'beldum', 'metang', 'metagross', 'gastly', 'haunter', 'gengar', 'misdreavus', 'shuppet', 'banette', 'duskull', 'dusclops']
    if any(mon in name_lower for mon in psychic_mons):
        return ["Psychic"]
    
    # Fighting types
    fighting_mons = ['mankey', 'primeape', 'machop', 'machoke', 'machamp', 'geodude', 'graveler', 'golem', 'onix', 'cubone', 'marowak', 'hitmonlee', 'hitmonchan', 'rhyhorn', 'rhydon', 'sandshrew', 'sandslash', 'diglett', 'dugtrio', 'tyrogue', 'hitmontop', 'larvitar', 'pupitar', 'tyranitar', 'makuhita', 'hariyama', 'nosepass', 'mawile', 'aron', 'lairon', 'aggron', 'regice', 'regirock', 'registeel', 'anorith', 'armaldo', 'phanpy', 'donphan', 'steelix', 'skarmory', 'nidoran', 'nidorina', 'nidorino', 'nidoqueen', 'nidoking']
    if any(mon in name_lower for mon in fighting_mons):
        return ["Fighting"]
    
    # Metal types
    metal_mons = ['magnemite', 'magneton', 'skarmory', 'forretress', 'steelix', 'beldum', 'metang', 'metagross', 'registeel', 'aron', 'lairon', 'aggron', 'mawile']
    if any(mon in name_lower for mon in metal_mons):
        return ["Metal"]
    
    # Darkness types
    if 'dark' in name_lower or any(mon in name_lower for mon in ['sableye', 'absol', 'mightyena', 'poochyena', 'murkrow']):
        return ["Darkness"]
    
    # Default to Colorless
    return ["Colorless"]

def estimate_hp(card_name, rarity):
    name_lower = card_name.lower()
    
    # No HP for non-Pokemon
    if any(keyword in name_lower for keyword in ['energy', 'fossil', 'berry', 'ball', 'stadium', 'project', 'search', 'advice', 'training', 'candy', 'reversal', 'switch', 'potion']):
        return None
    
    # Star cards
    if '☆' in card_name or '*' in card_name:
        return 70
    
    # EX cards
    if 'ex' in rarity.lower():
        if any(mon in name_lower for mon in ['mewtwo', 'mew', 'deoxys', 'jirachi', 'celebi', 'ho-oh', 'lugia', 'groudon', 'kyogre', 'rayquaza', 'latias', 'latios', 'regice', 'regirock', 'registeel']):
            return 100
        elif any(mon in name_lower for mon in ['charizard', 'blastoise', 'venusaur', 'alakazam', 'machamp', 'golem', 'gengar', 'meganium', 'typhlosion', 'feraligatr', 'ampharos', 'tyranitar', 'blaziken', 'sceptile', 'swampert', 'gardevoir', 'aggron', 'salamence', 'metagross', 'flygon', 'exploud', 'delcatty', 'shiftry']):
            return 150
        else:
            return 120
    
    # Baby Pokemon
    if any(mon in name_lower for mon in ['igglybuff']):
        return 30
    
    # Default HP
    return random.choice([50, 60, 70])

def generate_keywords(card_name, set_name):
    keywords = []
    clean_name = re.sub(r'[^\w\s]', '', card_name.lower())
    keywords.extend(clean_name.split())
    keywords.extend(['ex', 'pokemon', 'tcg', 'card'])
    
    if 'δ' in card_name:
        keywords.extend(['delta', 'species'])
    
    if '☆' in card_name or '*' in card_name:
        keywords.extend(['star', 'shining'])
    
    keywords = list(set([k for k in keywords if len(k) > 2]))
    return keywords

# EX Crystal Guardians set info
set_info = {
    'name': 'EX Crystal Guardians',
    'set_code': 'CG',
    'description': 'Introduces Crystal-themed Trainer cards and features both regular and Delta Species Pokémon. Notable for Alakazam Star and Celebi Star cards.',
    'release_date': '2006-08-30',
    'total_cards': '100',
    'image_path': 'excrystalguardians'
}

cards = []
with open('data/cards/to-import/ex_crystal_guardians_set_list.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        card_name = clean_card_name(row['card_name'])
        card_number = str(row['card_number'])
        rarity = row['rarity']
        
        full_number = f"{card_number}/{set_info['total_cards']}"
        card_types = parse_card_types(card_name, rarity)
        
        hp = None
        if card_types and card_types[0] not in ['Energy', 'Trainer']:
            hp = estimate_hp(card_name, rarity)
        
        image_url = f"https://www.serebii.net/card/{set_info['image_path']}/{card_number.lower()}.jpg"
        
        card_data = {
            'id': f"{set_info['set_code'].lower()}-{card_number}",
            'name': card_name,
            'setName': set_info['name'],
            'setCode': set_info['set_code'],
            'cardNumber': card_number,
            'fullNumber': full_number,
            'rarity': rarity,
            'type': card_types,
            'artist': 'Unknown',
            'matchingKeywords': generate_keywords(card_name, set_info['name']),
            'imageUrl': image_url
        }
        
        if hp is not None:
            card_data['hp'] = hp
        
        cards.append(card_data)

dataset = {
    'setName': set_info['name'],
    'description': set_info['description'],
    'releaseDate': set_info['release_date'],
    'totalCards': set_info['total_cards'],
    'tagSales': True,
    'cards': cards
}

with open('data/cards/ex-crystal-guardians.json', 'w', encoding='utf-8') as f:
    json.dump(dataset, f, indent=2, ensure_ascii=False)

print(f'Generated ex-crystal-guardians.json with {len(dataset["cards"])} cards') 