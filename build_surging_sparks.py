#!/usr/bin/env python3
"""
Build Surging Sparks card dataset
Release date: 2024/11/08
"""

import json
import re

def clean_card_name(name):
    """Clean card name for better matching"""
    # Remove 'ex' suffix but keep it in matching keywords
    name = name.replace('ex', '').strip()
    return name

def generate_matching_keywords(card_name, card_number, rarity, card_type):
    """Generate matching keywords for fuzzy search"""
    keywords = []
    
    # Basic name variations
    base_name = clean_card_name(card_name)
    keywords.append(base_name.lower())
    keywords.append(card_name.lower())  # Include original name with 'ex'
    
    # Add individual words from name
    name_words = base_name.split()
    keywords.extend([word.lower() for word in name_words if len(word) > 2])
    
    # Card number variations
    keywords.append(f"#{card_number}")
    keywords.append(card_number)
    keywords.append(f"surging sparks {card_number}")
    
    # Type-based keywords
    keywords.append(card_type.lower())
    
    # Rarity-based keywords
    keywords.append(rarity.lower().replace(' ', ''))
    if 'rare' in rarity.lower():
        keywords.append('rare')
    if 'ex' in card_name.lower():
        keywords.append('ex')
        keywords.append(f'{base_name.lower()} ex')
    
    # Special variations for common Pokemon
    special_keywords = {
        'pikachu': ['pikachu', 'pika'],
        'charizard': ['charizard', 'zard'],
        'mewtwo': ['mewtwo', 'mew two'],
        'eevee': ['eevee', 'eeveelution'],
        'lucario': ['lucario', 'aura pokemon'],
        'garchomp': ['garchomp', 'land shark'],
        'rayquaza': ['rayquaza', 'dragon ascent'],
        'kyurem': ['kyurem', 'black kyurem', 'white kyurem'],
        'latias': ['latias', 'eon pokemon'],
        'latios': ['latios', 'eon pokemon']
    }
    
    base_lower = base_name.lower()
    for pokemon, aliases in special_keywords.items():
        if pokemon in base_lower:
            keywords.extend(aliases)
    
    # Set-specific keywords
    keywords.extend(['surging sparks', 'sv8', 'sv', 'scarlet violet'])
    
    return list(set(keywords))  # Remove duplicates

def parse_surging_sparks_data():
    """Parse the Surging Sparks card data"""
    
    # Card data as provided
    card_data = """
001/191	H	Exeggcute	Grass	Common
002/191	H	Exeggcute	Grass	Common
003/191	H	Exeggutor	Grass	Uncommon
004/191	H	Durantex	Grass	Double Rare
005/191	H	Scatterbug	Grass	Common
006/191	H	Spewpa	Grass	Common
007/191	H	Vivillon	Grass	Uncommon
008/191	H	Morelull	Grass	Common
009/191	H	Shiinotic	Grass	Uncommon
010/191	H	Dhelmise	Grass	Common
011/191	H	Zarude	Grass	Rare
012/191	H	Capsakid	Grass	Common
013/191	H	Rellor	Grass	Common
014/191	H	Rabsca	Grass	Rare
015/191	H	Wo-Chien	Grass	Uncommon
016/191	H	Vulpix	Fire	Common
017/191	H	Ninetales	Fire	Uncommon
018/191	H	Paldean Tauros	Fire	Uncommon
019/191	H	Ho-Oh	Fire	Uncommon
020/191	H	Castform Sunny Form	Fire	Common
021/191	H	Victini	Fire	Uncommon
022/191	H	Pansear	Fire	Common
023/191	H	Simisear	Fire	Common
024/191	H	Larvesta	Fire	Common
025/191	H	Volcarona	Fire	Common
026/191	H	Oricorio	Fire	Common
027/191	H	Sizzlipede	Fire	Common
028/191	H	Centiskorch	Fire	Common
029/191	H	Fuecoco	Fire	Common
030/191	H	Crocalor	Fire	Common
031/191	H	Skeledirge	Fire	Rare
032/191	H	Charcadet	Fire	Common
033/191	H	Charcadet	Fire	Common
034/191	H	Armarouge	Fire	Uncommon
035/191	H	Ceruledge	Fire	Uncommon
036/191	H	Ceruledgeex	Fire	Double Rare
037/191	H	Scovillainex	Fire	Double Rare
038/191	H	Gouging Fire	Fire	Rare
039/191	H	Paldean Tauros	Water	Uncommon
040/191	H	Mantine	Water	Common
041/191	H	Feebas	Water	Common
042/191	H	Miloticex	Water	Double Rare
043/191	H	Spheal	Water	Common
044/191	H	Sealeo	Water	Common
045/191	H	Walrein	Water	Uncommon
046/191	H	Shellos	Water	Common
047/191	H	Cryogonal	Water	Common
048/191	H	Black Kyuremex	Water	Double Rare
049/191	H	Bruxish	Water	Uncommon
050/191	H	Quaxly	Water	Common
051/191	H	Quaxwell	Water	Common
052/191	H	Quaquaval	Water	Uncommon
053/191	H	Cetoddle	Water	Common
054/191	H	Cetitan	Water	Common
055/191	H	Iron Bundle	Water	Uncommon
056/191	H	Chien-Pao	Water	Rare
057/191	H	Pikachuex	Lightning	Double Rare
058/191	H	Magnemite	Lightning	Common
059/191	H	Magneton	Lightning	Uncommon
060/191	H	Magnezone	Lightning	Uncommon
061/191	H	Rotom	Lightning	Common
062/191	H	Blitzle	Lightning	Common
063/191	H	Zebstrika	Lightning	Common
064/191	H	Stunfisk	Lightning	Common
065/191	H	Tapu Koko	Lightning	Rare
066/191	H	Wattrel	Lightning	Common
067/191	H	Kilowattrel	Lightning	Uncommon
068/191	H	Kilowattrelex	Lightning	Double Rare
069/191	H	Miraidon	Lightning	Uncommon
070/191	H	Togepi	Psychic	Common
071/191	H	Togetic	Psychic	Common
072/191	H	Togekiss	Psychic	Rare
073/191	H	Marill	Psychic	Common
074/191	H	Azumarill	Psychic	Uncommon
075/191	H	Smoochum	Psychic	Common
076/191	H	Latiasex	Psychic	Double Rare
077/191	H	Latios	Psychic	Uncommon
078/191	H	Uxie	Psychic	Common
079/191	H	Mesprit	Psychic	Common
080/191	H	Azelf	Psychic	Common
081/191	H	Sigilyph	Psychic	Common
082/191	H	Yamask	Psychic	Common
083/191	H	Cofagrigus	Psychic	Rare
084/191	H	Espurr	Psychic	Common
085/191	H	Meowstic	Psychic	Uncommon
086/191	H	Sylveonex	Psychic	Double Rare
087/191	H	Dedenne	Psychic	Common
088/191	H	Xerneas	Psychic	Uncommon
089/191	H	Oricorio	Psychic	Common
090/191	H	Sandygast	Psychic	Common
091/191	H	Palossandex	Psychic	Double Rare
092/191	H	Tapu Lele	Psychic	Rare
093/191	H	Indeedee	Psychic	Uncommon
094/191	H	Flittle	Psychic	Common
095/191	H	Espathra	Psychic	Uncommon
096/191	H	Flutter Mane	Psychic	Uncommon
097/191	H	Gimmighoul	Psychic	Common
098/191	H	Mankey	Fighting	Common
099/191	H	Primeape	Fighting	Common
100/191	H	Annihilape	Fighting	Uncommon
101/191	H	Paldean Tauros	Fighting	Uncommon
102/191	H	Phanpy	Fighting	Common
103/191	H	Donphan	Fighting	Common
104/191	H	Trapinch	Fighting	Common
105/191	H	Vibrava	Fighting	Common
106/191	H	Flygonex	Fighting	Double Rare
107/191	H	Gastrodon	Fighting	Rare
108/191	H	Drilbur	Fighting	Common
109/191	H	Excadrill	Fighting	Common
110/191	H	Landorus	Fighting	Rare
111/191	H	Passimian	Fighting	Uncommon
112/191	H	Clobbopus	Fighting	Common
113/191	H	Grapploct	Fighting	Common
114/191	H	Glimmet	Fighting	Common
115/191	H	Glimmora	Fighting	Common
116/191	H	Koraidon	Fighting	Uncommon
117/191	H	Deino	Darkness	Common
118/191	H	Zweilous	Darkness	Common
119/191	H	Hydreigonex	Darkness	Double Rare
120/191	H	Shroodle	Darkness	Common
121/191	H	Grafaiai	Darkness	Uncommon
122/191	H	Alolan Diglett	Metal	Common
123/191	H	Alolan Dugtrio	Metal	Uncommon
124/191	H	Skarmory	Metal	Common
125/191	H	Registeel	Metal	Uncommon
126/191	H	Bronzor	Metal	Common
127/191	H	Bronzong	Metal	Common
128/191	H	Klefki	Metal	Common
129/191	H	Duraludon	Metal	Common
130/191	H	Archaludonex	Metal	Double Rare
131/191	H	Gholdengo	Metal	Uncommon
132/191	H	Iron Crown	Metal	Rare
133/191	H	Alolan Exeggutorex	Dragon	Double Rare
134/191	H	Altaria	Dragon	Uncommon
135/191	H	Dialga	Dragon	Rare
136/191	H	Palkia	Dragon	Rare
137/191	H	Turtonator	Dragon	Uncommon
138/191	H	Applin	Dragon	Common
139/191	H	Flapple	Dragon	Uncommon
140/191	H	Appletun	Dragon	Uncommon
141/191	H	Eternatus	Dragon	Rare
142/191	H	Tatsugiriex	Dragon	Double Rare
143/191	H	Eevee	Colorless	Common
144/191	H	Snorlax	Colorless	Common
145/191	H	Slakoth	Colorless	Common
146/191	H	Vigoroth	Colorless	Common
147/191	H	Slakingex	Colorless	Double Rare
148/191	H	Swablu	Colorless	Common
149/191	H	Zangoose	Colorless	Common
150/191	H	Kecleon	Colorless	Common
151/191	H	Bouffalant	Colorless	Common
152/191	H	Rufflet	Colorless	Common
153/191	H	Braviary	Colorless	Uncommon
154/191	H	Helioptile	Colorless	Common
155/191	H	Heliolisk	Colorless	Common
156/191	H	Oranguru	Colorless	Common
157/191	H	Tandemaus	Colorless	Common
158/191	H	Maushold	Colorless	Uncommon
159/191	H	Cyclizarex	Colorless	Double Rare
160/191	H	Flamigoex	Colorless	Double Rare
161/191	H	Terapagos	Colorless	Rare
162/191	H	Amulet of Hope	PT	ACE SPEC Rare
163/191	H	Babiri Berry	PT	Uncommon
164/191	H	Brilliant Blender	I	ACE SPEC Rare
165/191	H	Call Bell	I	Uncommon
166/191	H	Chill Teaser Toy	I	Uncommon
167/191	H	Clemont's Quick Wit	Su	Uncommon
168/191	H	Colbur Berry	PT	Uncommon
169/191	H	Counter Gain	PT	Uncommon
170/191	H	Cyrano	Su	Uncommon
171/191	H	Deduction Kit	I	Uncommon
172/191	H	Dragon Elixir	I	Uncommon
173/191	H	Drasna	Su	Common
174/191	H	Drayton	Su	Uncommon
175/191	H	Dusk Ball	I	Uncommon
176/191	H	Energy Search Pro	I	ACE SPEC Rare
177/191	H	Gravity Mountain	St	Uncommon
178/191	H	Jasmine's Gaze	Su	Uncommon
179/191	H	Lisia's Appeal	Su	Uncommon
180/191	H	Lively Stadium	St	Uncommon
181/191	H	Meddling Memo	I	Uncommon
182/191	H	Megaton Blower	I	ACE SPEC Rare
183/191	H	Miracle Headset	I	ACE SPEC Rare
184/191	H	Passho Berry	PT	Uncommon
185/191	H	Precious Trolley	I	ACE SPEC Rare
186/191	H	Scramble Switch	I	ACE SPEC Rare
187/191	H	Surfer	Su	Uncommon
188/191	H	Technical Machine: Fluorite	PT	Uncommon
189/191	H	Tera Orb	I	Uncommon
190/191	H	Tyme	Su	Uncommon
191/191	H	Enriching Energy	Colorless E	ACE SPEC Rare
192/191	H	Exeggcute	Grass	Illustration Rare
193/191	H	Vivillon	Grass	Illustration Rare
194/191	H	Shiinotic	Grass	Illustration Rare
195/191	H	Castform Sunny Form	Fire	Illustration Rare
196/191	H	Larvesta	Fire	Illustration Rare
197/191	H	Ceruledge	Fire	Illustration Rare
198/191	H	Feebas	Water	Illustration Rare
199/191	H	Spheal	Water	Illustration Rare
200/191	H	Bruxish	Water	Illustration Rare
201/191	H	Cetitan	Water	Illustration Rare
202/191	H	Stunfisk	Lightning	Illustration Rare
203/191	H	Latios	Psychic	Illustration Rare
204/191	H	Mesprit	Psychic	Illustration Rare
205/191	H	Phanpy	Fighting	Illustration Rare
206/191	H	Vibrava	Fighting	Illustration Rare
207/191	H	Clobbopus	Fighting	Illustration Rare
208/191	H	Alolan Dugtrio	Metal	Illustration Rare
209/191	H	Skarmory	Metal	Illustration Rare
210/191	H	Flapple	Dragon	Illustration Rare
211/191	H	Appletun	Dragon	Illustration Rare
212/191	H	Slakoth	Colorless	Illustration Rare
213/191	H	Kecleon	Colorless	Illustration Rare
214/191	H	Braviary	Colorless	Illustration Rare
215/191	H	Durantex	Grass	Ultra Rare
216/191	H	Scovillainex	Fire	Ultra Rare
217/191	H	Miloticex	Water	Ultra Rare
218/191	H	Black Kyuremex	Water	Ultra Rare
219/191	H	Pikachuex	Lightning	Ultra Rare
220/191	H	Latiasex	Psychic	Ultra Rare
221/191	H	Palossandex	Psychic	Ultra Rare
222/191	H	Flygonex	Fighting	Ultra Rare
223/191	H	Hydreigonex	Darkness	Ultra Rare
224/191	H	Archaludonex	Metal	Ultra Rare
225/191	H	Alolan Exeggutorex	Dragon	Ultra Rare
226/191	H	Tatsugiriex	Dragon	Ultra Rare
227/191	H	Slakingex	Colorless	Ultra Rare
228/191	H	Cyclizarex	Colorless	Ultra Rare
229/191	H	Clemont's Quick Wit	Su	Ultra Rare
230/191	H	Cyrano	Su	Ultra Rare
231/191	H	Drasna	Su	Ultra Rare
232/191	H	Drayton	Su	Ultra Rare
233/191	H	Jasmine's Gaze	Su	Ultra Rare
234/191	H	Lisia's Appeal	Su	Ultra Rare
235/191	H	Surfer	Su	Ultra Rare
236/191	H	Durantex	Grass	Special Illustration Rare
237/191	H	Miloticex	Water	Special Illustration Rare
238/191	H	Pikachuex	Lightning	Special Illustration Rare
239/191	H	Latiasex	Psychic	Special Illustration Rare
240/191	H	Hydreigonex	Darkness	Special Illustration Rare
241/191	H	Archaludonex	Metal	Special Illustration Rare
242/191	H	Alolan Exeggutorex	Dragon	Special Illustration Rare
243/191	H	Clemont's Quick Wit	Su	Special Illustration Rare
244/191	H	Drayton	Su	Special Illustration Rare
245/191	H	Jasmine's Gaze	Su	Special Illustration Rare
246/191	H	Lisia's Appeal	Su	Special Illustration Rare
247/191	H	Pikachuex	Lightning	Hyper Rare
248/191	H	Alolan Exeggutorex	Dragon	Hyper Rare
249/191	H	Counter Gain	PT	Hyper Rare
250/191	H	Gravity Mountain	St	Hyper Rare
251/191	H	Night Stretcher	I	Hyper Rare
252/191	H	Jet Energy	Colorless E	Hyper Rare
    """
    
    cards = []
    lines = [line.strip() for line in card_data.strip().split('\n') if line.strip()]
    
    for line in lines:
        parts = line.split('\t')
        if len(parts) >= 5:
            card_number = parts[0]
            mark = parts[1]
            name = parts[2]
            card_type = parts[3]
            rarity = parts[4]
            
            # Determine card type category
            type_categories = {
                'Grass': ['Grass'],
                'Fire': ['Fire'],
                'Water': ['Water'],
                'Lightning': ['Electric'],
                'Psychic': ['Psychic'],
                'Fighting': ['Fighting'],
                'Darkness': ['Darkness'],
                'Metal': ['Steel'],
                'Dragon': ['Dragon'],
                'Colorless': ['Normal'],
                'PT': ['Trainer'],
                'I': ['Trainer'],
                'Su': ['Trainer'],
                'St': ['Trainer'],
                'Colorless E': ['Energy']
            }
            
            types = type_categories.get(card_type, [card_type])
            
            # Estimate HP for Pokemon cards
            hp = None
            if card_type not in ['PT', 'I', 'Su', 'St', 'Colorless E']:
                if 'ex' in name.lower():
                    hp = 230  # ex Pokemon typically have higher HP
                elif rarity in ['Ultra Rare', 'Special Illustration Rare', 'Hyper Rare']:
                    hp = 210
                elif rarity in ['Double Rare', 'Illustration Rare']:
                    hp = 180
                elif rarity == 'Rare':
                    hp = 130
                elif rarity == 'Uncommon':
                    hp = 100
                else:
                    hp = 70
            
            # Generate price variants for different rarities
            price_variants = {}
            base_prices = {
                'Common': [0.10, 2.00],
                'Uncommon': [0.50, 5.00],
                'Rare': [2.00, 15.00],
                'Double Rare': [8.00, 40.00],
                'Ultra Rare': [15.00, 80.00],
                'Illustration Rare': [10.00, 50.00],
                'Special Illustration Rare': [25.00, 150.00],
                'Hyper Rare': [30.00, 200.00],
                'ACE SPEC Rare': [5.00, 25.00]
            }
            
            if rarity in base_prices:
                min_price, max_price = base_prices[rarity]
                price_variants = {
                    'Regular': {'min': min_price, 'max': max_price, 'average': (min_price + max_price) / 2}
                }
                
                # Add graded variants for valuable cards
                if max_price > 10:
                    price_variants['PSA 10'] = {
                        'min': max_price * 2,
                        'max': max_price * 5,
                        'average': max_price * 3
                    }
                    price_variants['BGS 10'] = {
                        'min': max_price * 1.8,
                        'max': max_price * 4.5,
                        'average': max_price * 2.8
                    }
            
            card = {
                'id': f'surging-sparks-{card_number.replace("/", "-")}',
                'name': name,
                'hp': hp,
                'type': types,
                'artist': 'Various',  # Placeholder
                'rarity': rarity,
                'setName': 'Surging Sparks',
                'setCode': 'SV8',
                'cardNumber': card_number.split('/')[0],
                'fullNumber': card_number,
                'releaseDate': '2024-11-08',
                'totalCards': 252,
                'matchingKeywords': generate_matching_keywords(name, card_number, rarity, card_type),
                'priceGuide': price_variants,
                'imageUrl': f'https://images.pokemontcg.io/sv8/{card_number.split("/")[0].zfill(3)}.png'
            }
            
            cards.append(card)
    
    return {
        'name': 'Surging Sparks',
        'setCode': 'SV8',
        'series': 'Scarlet & Violet',
        'releaseDate': '2024-11-08',
        'totalCards': 252,
        'description': 'The eighth expansion in the Scarlet & Violet series featuring powerful ex Pokemon and new mechanics.',
        'lastUpdated': '2024-12-19',
        'cards': cards
    }

def main():
    """Main function to build and save the card data"""
    print("Building Surging Sparks card dataset...")
    
    # Parse the data
    dataset = parse_surging_sparks_data()
    
    # Save to JSON file
    output_file = 'data/cards/surging-sparks.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Created {output_file}")
    print(f"📊 Added {len(dataset['cards'])} cards")
    print(f"🎯 Set: {dataset['name']} ({dataset['setCode']})")
    print(f"📅 Release: {dataset['releaseDate']}")

if __name__ == '__main__':
    main() 