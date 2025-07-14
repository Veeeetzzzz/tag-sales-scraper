#!/usr/bin/env python3

import json
import os
from collections import defaultdict

def generate_fates_collide_dataset():
    """Generate the Fates Collide TCG set dataset"""
    
    # Set information
    set_info = {
        "name": "Fates Collide",
        "series": "XY",
        "release_date": "2016-05-02",
        "total_cards": 125,
        "symbol": "FCO",
        "logo": "https://www.serebii.net/card/fatescollide/logo.png"
    }
    
    # Card data with proper HP values and rarities
    cards_data = [
        # Grass Cards (1-8)
        {"name": "Shuckle", "number": "1", "type": "Grass", "rarity": "Uncommon", "hp": 60},
        {"name": "Burmy", "number": "2", "type": "Grass", "rarity": "Common", "hp": 50},
        {"name": "Wormadam", "number": "3", "type": "Grass", "rarity": "Uncommon", "hp": 90},
        {"name": "Mothim", "number": "4", "type": "Grass", "rarity": "Rare", "hp": 90},
        {"name": "Snivy", "number": "5", "type": "Grass", "rarity": "Common", "hp": 60},
        {"name": "Servine", "number": "6", "type": "Grass", "rarity": "Uncommon", "hp": 80},
        {"name": "Serperior", "number": "7", "type": "Grass", "rarity": "Rare", "hp": 130},
        {"name": "Deerling", "number": "8", "type": "Grass", "rarity": "Common", "hp": 60},
        
        # Fire Cards (9-14)
        {"name": "Moltres", "number": "9", "type": "Fire", "rarity": "Rare", "hp": 130},
        {"name": "Fennekin", "number": "10", "type": "Fire", "rarity": "Common", "hp": 60},
        {"name": "Fennekin", "number": "11", "type": "Fire", "rarity": "Common", "hp": 60},
        {"name": "Braixen", "number": "12", "type": "Fire", "rarity": "Uncommon", "hp": 80},
        {"name": "Delphox", "number": "13", "type": "Fire", "rarity": "Rare Holo", "hp": 130},
        {"name": "DelphoxBREAK", "number": "14", "type": "Fire", "rarity": "Rare BREAK", "hp": 160, "keywords": ["break"]},
        
        # Water Cards (15-23)
        {"name": "Seel", "number": "15", "type": "Water", "rarity": "Common", "hp": 70},
        {"name": "Dewgong", "number": "16", "type": "Water", "rarity": "Uncommon", "hp": 100},
        {"name": "Omanyte", "number": "17", "type": "Water", "rarity": "Uncommon", "hp": 70},
        {"name": "Omastar", "number": "18", "type": "Water", "rarity": "Rare", "hp": 110},
        {"name": "OmastarBREAK", "number": "19", "type": "Water", "rarity": "Rare BREAK", "hp": 140, "keywords": ["break"]},
        {"name": "GlaceonEX", "number": "20", "type": "Water", "rarity": "Rare Holo ex", "hp": 160, "keywords": ["ex"]},
        {"name": "White Kyurem", "number": "21", "type": "Water", "rarity": "Rare Holo", "hp": 130},
        {"name": "Binacle", "number": "22", "type": "Water", "rarity": "Common", "hp": 70},
        {"name": "Barbaracle", "number": "23", "type": "Water", "rarity": "Rare", "hp": 120},
        
        # Lightning Cards (24)
        {"name": "Rotom", "number": "24", "type": "Lightning", "rarity": "Rare", "hp": 60},
        
        # Psychic Cards (25-35)
        {"name": "AlakazamEX", "number": "25", "type": "Psychic", "rarity": "Rare Holo ex", "hp": 160, "keywords": ["ex"]},
        {"name": "MegaAlakazamEX", "number": "26", "type": "Psychic", "rarity": "Rare Holo ex", "hp": 210, "keywords": ["ex", "mega-evolution"]},
        {"name": "Koffing", "number": "27", "type": "Psychic", "rarity": "Common", "hp": 60},
        {"name": "Weezing", "number": "28", "type": "Psychic", "rarity": "Uncommon", "hp": 90},
        {"name": "Mew", "number": "29", "type": "Psychic", "rarity": "Rare Holo", "hp": 60},
        {"name": "Spoink", "number": "30", "type": "Psychic", "rarity": "Common", "hp": 60},
        {"name": "Grumpig", "number": "31", "type": "Psychic", "rarity": "Rare", "hp": 100},
        {"name": "Gothita", "number": "32", "type": "Psychic", "rarity": "Common", "hp": 60},
        {"name": "Solosis", "number": "33", "type": "Psychic", "rarity": "Common", "hp": 60},
        {"name": "Duosion", "number": "34", "type": "Psychic", "rarity": "Uncommon", "hp": 80},
        {"name": "Reuniclus", "number": "35", "type": "Psychic", "rarity": "Rare", "hp": 120},
        
        # Fighting Cards (36-54)
        {"name": "Diglett", "number": "36", "type": "Fighting", "rarity": "Common", "hp": 50},
        {"name": "Marowak", "number": "37", "type": "Fighting", "rarity": "Rare", "hp": 100},
        {"name": "Kabuto", "number": "38", "type": "Fighting", "rarity": "Uncommon", "hp": 80},
        {"name": "Kabutops", "number": "39", "type": "Fighting", "rarity": "Rare", "hp": 120},
        {"name": "Larvitar", "number": "40", "type": "Fighting", "rarity": "Common", "hp": 60},
        {"name": "Larvitar", "number": "41", "type": "Fighting", "rarity": "Common", "hp": 60},
        {"name": "Pupitar", "number": "42", "type": "Fighting", "rarity": "Uncommon", "hp": 80},
        {"name": "RegirockEX", "number": "43", "type": "Fighting", "rarity": "Rare Holo ex", "hp": 180, "keywords": ["ex"]},
        {"name": "Wormadam", "number": "44", "type": "Fighting", "rarity": "Uncommon", "hp": 90},
        {"name": "Riolu", "number": "45", "type": "Fighting", "rarity": "Common", "hp": 60},
        {"name": "Riolu", "number": "46", "type": "Fighting", "rarity": "Common", "hp": 60},
        {"name": "Lucario", "number": "47", "type": "Fighting", "rarity": "Rare", "hp": 110},
        {"name": "Hawlucha", "number": "48", "type": "Fighting", "rarity": "Uncommon", "hp": 80},
        {"name": "Carbink", "number": "49", "type": "Fighting", "rarity": "Rare", "hp": 90},
        {"name": "Carbink", "number": "50", "type": "Fighting", "rarity": "Common", "hp": 90},
        {"name": "CarbinkBREAK", "number": "51", "type": "Fighting", "rarity": "Rare BREAK", "hp": 120, "keywords": ["break"]},
        {"name": "Zygarde", "number": "52", "type": "Fighting", "rarity": "Uncommon", "hp": 100},
        {"name": "Zygarde", "number": "53", "type": "Fighting", "rarity": "Rare", "hp": 100},
        {"name": "ZygardeEX", "number": "54", "type": "Fighting", "rarity": "Rare Holo ex", "hp": 190, "keywords": ["ex"]},
        
        # Darkness Cards (55-58)
        {"name": "UmbreonEX", "number": "55", "type": "Darkness", "rarity": "Rare Holo ex", "hp": 160, "keywords": ["ex"]},
        {"name": "Tyranitar", "number": "56", "type": "Darkness", "rarity": "Rare Holo", "hp": 160},
        {"name": "Vullaby", "number": "57", "type": "Darkness", "rarity": "Common", "hp": 60},
        {"name": "Mandibuzz", "number": "58", "type": "Darkness", "rarity": "Rare", "hp": 110},
        
        # Metal Cards (59-64)
        {"name": "Wormadam", "number": "59", "type": "Metal", "rarity": "Uncommon", "hp": 90},
        {"name": "Bronzor", "number": "60", "type": "Metal", "rarity": "Common", "hp": 60},
        {"name": "Bronzong", "number": "61", "type": "Metal", "rarity": "Rare", "hp": 100},
        {"name": "BronzongBREAK", "number": "62", "type": "Metal", "rarity": "Rare BREAK", "hp": 130, "keywords": ["break"]},
        {"name": "Lucario", "number": "63", "type": "Metal", "rarity": "Rare Holo", "hp": 110},
        {"name": "GenesectEX", "number": "64", "type": "Metal", "rarity": "Rare Holo ex", "hp": 170, "keywords": ["ex"]},
        
        # Fairy Cards (65-72)
        {"name": "Jigglypuff", "number": "65", "type": "Fairy", "rarity": "Common", "hp": 60},
        {"name": "Wigglytuff", "number": "66", "type": "Fairy", "rarity": "Uncommon", "hp": 90},
        {"name": "Mr. Mime", "number": "67", "type": "Fairy", "rarity": "Rare", "hp": 80},
        {"name": "Snubbull", "number": "68", "type": "Fairy", "rarity": "Common", "hp": 60},
        {"name": "MegaAltariaEX", "number": "69", "type": "Fairy", "rarity": "Rare Holo ex", "hp": 200, "keywords": ["ex", "mega-evolution"]},
        {"name": "Cottonee", "number": "70", "type": "Fairy", "rarity": "Common", "hp": 50},
        {"name": "Whimsicott", "number": "71", "type": "Fairy", "rarity": "Uncommon", "hp": 80},
        {"name": "DiancieEX", "number": "72", "type": "Fairy", "rarity": "Rare Holo ex", "hp": 160, "keywords": ["ex"]},
        
        # Dragon Cards (73)
        {"name": "KingdraEX", "number": "73", "type": "Dragon", "rarity": "Rare Holo ex", "hp": 170, "keywords": ["ex"]},
        
        # Colorless Cards (74-89)
        {"name": "Meowth", "number": "74", "type": "Colorless", "rarity": "Common", "hp": 60},
        {"name": "Kangaskhan", "number": "75", "type": "Colorless", "rarity": "Uncommon", "hp": 110},
        {"name": "Aerodactyl", "number": "76", "type": "Colorless", "rarity": "Rare", "hp": 100},
        {"name": "Snorlax", "number": "77", "type": "Colorless", "rarity": "Rare", "hp": 130},
        {"name": "Lugia", "number": "78", "type": "Colorless", "rarity": "Rare", "hp": 130},
        {"name": "LugiaBREAK", "number": "79", "type": "Colorless", "rarity": "Rare BREAK", "hp": 160, "keywords": ["break"]},
        {"name": "Whismur", "number": "80", "type": "Colorless", "rarity": "Common", "hp": 60},
        {"name": "Loudred", "number": "81", "type": "Colorless", "rarity": "Uncommon", "hp": 90},
        {"name": "Exploud", "number": "82", "type": "Colorless", "rarity": "Rare", "hp": 140},
        {"name": "AltariaEX", "number": "83", "type": "Colorless", "rarity": "Rare Holo ex", "hp": 170, "keywords": ["ex"]},
        {"name": "AudinoEX", "number": "84", "type": "Colorless", "rarity": "Rare Holo ex", "hp": 180, "keywords": ["ex"]},
        {"name": "MegaAudinoEX", "number": "85", "type": "Colorless", "rarity": "Rare Holo ex", "hp": 210, "keywords": ["ex", "mega-evolution"]},
        {"name": "Minccino", "number": "86", "type": "Colorless", "rarity": "Common", "hp": 60},
        {"name": "Minccino", "number": "87", "type": "Colorless", "rarity": "Common", "hp": 60},
        {"name": "Cinccino", "number": "88", "type": "Colorless", "rarity": "Uncommon", "hp": 90},
        {"name": "Cinccino", "number": "89", "type": "Colorless", "rarity": "Uncommon", "hp": 90},
        
        # Trainer Cards (90-113)
        {"name": "Alakazam Spirit Link", "number": "90", "type": "Trainer", "rarity": "Uncommon", "keywords": ["item", "spirit-link"]},
        {"name": "Altaria Spirit Link", "number": "91", "type": "Trainer", "rarity": "Uncommon", "keywords": ["item", "spirit-link"]},
        {"name": "Audino Spirit Link", "number": "92", "type": "Trainer", "rarity": "Uncommon", "keywords": ["item", "spirit-link"]},
        {"name": "Bent Spoon", "number": "93", "type": "Trainer", "rarity": "Uncommon", "keywords": ["item"]},
        {"name": "Chaos Tower", "number": "94", "type": "Trainer", "rarity": "Uncommon", "keywords": ["stadium"]},
        {"name": "Devolution Spray", "number": "95", "type": "Trainer", "rarity": "Uncommon", "keywords": ["item"]},
        {"name": "Dome Fossil Kabuto", "number": "96", "type": "Trainer", "rarity": "Uncommon", "keywords": ["item", "fossil"]},
        {"name": "Energy Pouch", "number": "97", "type": "Trainer", "rarity": "Uncommon", "keywords": ["item"]},
        {"name": "Energy Reset", "number": "98", "type": "Trainer", "rarity": "Uncommon", "keywords": ["item"]},
        {"name": "Fairy Drop", "number": "99", "type": "Trainer", "rarity": "Uncommon", "keywords": ["item"]},
        {"name": "Fairy Garden", "number": "100", "type": "Trainer", "rarity": "Uncommon", "keywords": ["stadium"]},
        {"name": "Fossil Excavation Kit", "number": "101", "type": "Trainer", "rarity": "Uncommon", "keywords": ["item", "fossil"]},
        {"name": "Helix Fossil Omanyte", "number": "102", "type": "Trainer", "rarity": "Uncommon", "keywords": ["item", "fossil"]},
        {"name": "Lass's Special", "number": "103", "type": "Trainer", "rarity": "Uncommon", "keywords": ["supporter"]},
        {"name": "Mega Catcher", "number": "104", "type": "Trainer", "rarity": "Uncommon", "keywords": ["item"]},
        {"name": "N", "number": "105", "type": "Trainer", "rarity": "Uncommon", "keywords": ["supporter"]},
        {"name": "Old Amber Aerodactyl", "number": "106", "type": "Trainer", "rarity": "Uncommon", "keywords": ["item", "fossil"]},
        {"name": "Pokémon Fan Club", "number": "107", "type": "Trainer", "rarity": "Uncommon", "keywords": ["supporter"]},
        {"name": "Power Memory", "number": "108", "type": "Trainer", "rarity": "Uncommon", "keywords": ["item"]},
        {"name": "Random Receiver", "number": "109", "type": "Trainer", "rarity": "Uncommon", "keywords": ["item"]},
        {"name": "Scorched Earth", "number": "110", "type": "Trainer", "rarity": "Uncommon", "keywords": ["stadium"]},
        {"name": "Shauna", "number": "111", "type": "Trainer", "rarity": "Uncommon", "keywords": ["supporter"]},
        {"name": "Team Rocket's Handiwork", "number": "112", "type": "Trainer", "rarity": "Uncommon", "keywords": ["supporter"]},
        {"name": "Ultra Ball", "number": "113", "type": "Trainer", "rarity": "Uncommon", "keywords": ["item"]},
        
        # Energy Cards (114-115)
        {"name": "Double Colorless Energy", "number": "114", "type": "Energy", "rarity": "Uncommon", "keywords": ["special-energy"]},
        {"name": "Strong Energy", "number": "115", "type": "Energy", "rarity": "Uncommon", "keywords": ["special-energy"]},
        
        # Ultra Rare Cards (116-124)
        {"name": "GlaceonEX", "number": "116", "type": "Water", "rarity": "Rare Ultra", "hp": 160, "keywords": ["ex"]},
        {"name": "AlakazamEX", "number": "117", "type": "Psychic", "rarity": "Rare Ultra", "hp": 160, "keywords": ["ex"]},
        {"name": "MegaAlakazamEX", "number": "118", "type": "Psychic", "rarity": "Rare Ultra", "hp": 210, "keywords": ["ex", "mega-evolution"]},
        {"name": "UmbreonEX", "number": "119", "type": "Darkness", "rarity": "Rare Ultra", "hp": 160, "keywords": ["ex"]},
        {"name": "GenesectEX", "number": "120", "type": "Metal", "rarity": "Rare Ultra", "hp": 170, "keywords": ["ex"]},
        {"name": "MegaAltariaEX", "number": "121", "type": "Fairy", "rarity": "Rare Ultra", "hp": 200, "keywords": ["ex", "mega-evolution"]},
        {"name": "KingdraEX", "number": "122", "type": "Dragon", "rarity": "Rare Ultra", "hp": 170, "keywords": ["ex"]},
        {"name": "AltariaEX", "number": "123", "type": "Colorless", "rarity": "Rare Ultra", "hp": 170, "keywords": ["ex"]},
        {"name": "Team Rocket's Handiwork", "number": "124", "type": "Trainer", "rarity": "Rare Ultra", "keywords": ["supporter"]},
        
        # Secret Rare Cards (125)
        {"name": "AlakazamEX", "number": "125", "type": "Psychic", "rarity": "Rare Secret", "hp": 160, "keywords": ["ex"]},
    ]
    
    # Create cards list
    cards = []
    for card_data in cards_data:
        card = {
            "id": f"fates-collide-{card_data['number']}",
            "name": card_data["name"],
            "number": card_data["number"],
            "set": "Fates Collide",
            "series": "XY",
            "type": card_data["type"],
            "rarity": card_data["rarity"],
            "artist": "5ban Graphics",
            "image_url": f"https://www.serebii.net/card/fatescollide/{card_data['number']}.jpg"
        }
        
        # Add HP for Pokémon cards
        if card_data.get("hp"):
            card["hp"] = card_data["hp"]
        
        # Add keywords if present
        if card_data.get("keywords"):
            card["keywords"] = card_data["keywords"]
        
        cards.append(card)
    
    # Create the complete dataset
    dataset = {
        "set_info": set_info,
        "cards": cards
    }
    
    return dataset

def main():
    # Generate dataset
    dataset = generate_fates_collide_dataset()
    
    # Create directory if it doesn't exist
    os.makedirs("data/cards", exist_ok=True)
    
    # Save to JSON file
    output_file = "data/cards/fates-collide.json"
    with open(output_file, 'w') as f:
        json.dump(dataset, f, indent=2)
    
    print(f"✅ Successfully generated Fates Collide dataset with {len(dataset['cards'])} cards")
    print(f"📁 Saved to: {output_file}")
    
    # Print statistics
    print(f"\n📊 Card Statistics:")
    
    # Rarity distribution
    rarity_count = defaultdict(int)
    type_count = defaultdict(int)
    duplicate_cards = defaultdict(list)
    break_cards = []
    spirit_link_cards = []
    fossil_cards = []
    wormadam_cards = []
    
    for card in dataset['cards']:
        rarity_count[card['rarity']] += 1
        type_count[card['type']] += 1
        
        # Track duplicates
        duplicate_cards[card['name']].append(card['number'])
        
        # Track BREAK cards
        if 'break' in card.get('keywords', []):
            break_cards.append(f"{card['name']} (#{card['number']}) - {card.get('hp', 'N/A')} HP, {card['rarity']}")
        
        # Track Spirit Link cards
        if 'spirit-link' in card.get('keywords', []):
            spirit_link_cards.append(f"{card['name']} (#{card['number']})")
        
        # Track Fossil cards
        if 'fossil' in card.get('keywords', []):
            fossil_cards.append(f"{card['name']} (#{card['number']})")
        
        # Track Wormadam cards
        if card['name'] == 'Wormadam':
            wormadam_cards.append(f"{card['name']} (#{card['number']}) - {card['type']} type, {card['rarity']}")
    
    print("Rarity Distribution:")
    for rarity in sorted(rarity_count.keys()):
        print(f"  {rarity}: {rarity_count[rarity]}")
    
    print(f"\nType Distribution:")
    for card_type in sorted(type_count.keys()):
        print(f"  {card_type}: {type_count[card_type]}")
    
    # Show duplicates
    duplicates = {name: numbers for name, numbers in duplicate_cards.items() if len(numbers) > 1}
    if duplicates:
        print(f"\n📋 Duplicate Card Analysis:")
        print(f"Cards with multiple versions: {len(duplicates)}")
        for name, numbers in sorted(duplicates.items()):
            print(f"  {name}: {len(numbers)} versions")
    
    # Show BREAK cards
    if break_cards:
        print(f"\n🔥 BREAK Card Analysis:")
        print(f"BREAK cards: {len(break_cards)}")
        for card in break_cards:
            print(f"  {card}")
    
    # Show Spirit Link cards
    if spirit_link_cards:
        print(f"\n🔗 Spirit Link Card Analysis:")
        print(f"Spirit Link cards: {len(spirit_link_cards)}")
        for card in spirit_link_cards:
            print(f"  {card}")
    
    # Show Fossil cards
    if fossil_cards:
        print(f"\n🏺 Fossil Card Analysis:")
        print(f"Fossil cards: {len(fossil_cards)}")
        for card in fossil_cards:
            print(f"  {card}")
    
    # Show Wormadam cards
    if wormadam_cards:
        print(f"\n🦋 Wormadam Card Analysis:")
        print(f"Wormadam cards: {len(wormadam_cards)}")
        for card in wormadam_cards:
            print(f"  {card}")

if __name__ == "__main__":
    main() 