import json
import os

with open('sheraz.json', 'r', encoding='utf-8') as f:
    shz = json.load(f)

sql = []
sql.append('-- ==============================================================================')
sql.append('-- Karachi Transit AI: Seed Data for Phase 1')
sql.append('-- Route 1 (Peoples Bus Service EV-1) + Sheraz Coach')
sql.append('-- ==============================================================================\n')
sql.append('TRUNCATE public.stop_aliases, public.stops, public.routes CASCADE;\n')

# Route 1: PBS-01
sql.append('-- Route 1: Peoples Bus Service')
sql.append("""INSERT INTO public.routes (id, route_code, name, operator, fleet_type, fare_type, base_fare_pkr, max_fare_pkr)
VALUES ('11111111-1111-1111-1111-111111111111', 'PBS-01', 'Peoples Bus Service - Route 1 (EV-1)', 'Peoples Bus Service', 'Electric AC', 'FLAT', 50, 50);
""")

pbs_stops = [
    ('ST-01', 'Model Colony', 1, 24.8992, 67.1865, True),
    ('ST-02', 'Malir Halt', 2, 24.8920, 67.1684, False),
    ('ST-03', 'Star Gate', 3, 24.8872, 67.1512, False),
    ('ST-04', 'Drigh Road Station', 4, 24.8789, 67.1265, False),
    ('ST-05', 'Karsaz', 5, 24.8722, 67.0988, False),
    ('ST-06', 'Baloch Colony', 6, 24.8654, 67.0782, False),
    ('ST-07', 'Nursery', 7, 24.8580, 67.0620, False),
    ('ST-08', 'FTC', 8, 24.8540, 67.0505, False),
    ('ST-09', 'Metropole Hotel', 9, 24.8505, 67.0315, False),
    ('ST-10', 'Arts Council', 10, 24.8548, 67.0180, False),
    ('ST-11', 'Tower', 11, 24.8530, 66.9995, True)
]

sql.append('-- Stops for Route 1')
for code, name, seq, lat, lng, term in pbs_stops:
    term_str = 'true' if term else 'false'
    sql.append(f"""INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('11111111-1111-1111-1111-{seq:012d}', '11111111-1111-1111-1111-111111111111', '{code}', '{name}', {seq}, {lat}, {lng}, {term_str});""")

pbs_aliases = {
    'airport': 3,
    'jinnah international': 3,
    'star gate': 3,
    'drig road': 4,
    'drigh road station': 4,
    'lal kothi': 4,
    'karsaz chowrangi': 5,
    'national stadium turn': 5,
    'pechs': 7,
    'nursery': 7,
    'ftc building': 8,
    'ftc': 8,
    'metropol': 9,
    'avari': 9,
    'saddar club road': 9,
    'arts council': 10,
    'sindh assembly': 10,
    'tower': 11,
    'kharadar': 11,
    'merewether clock tower': 11,
    'model colony': 1,
    'malir halt': 2,
    'baloch colony': 6
}

sql.append('\n-- Aliases for Route 1')
for alias, seq in pbs_aliases.items():
    clean_alias = alias.replace("'", "''")
    sql.append(f"""INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-{seq:012d}', '{clean_alias}');""")

# Route 2: Sheraz Coach
sql.append('\n-- Route 2: Sheraz Coach')
sql.append("""INSERT INTO public.routes (id, route_code, name, operator, fleet_type, fare_type, base_fare_pkr, max_fare_pkr)
VALUES ('22222222-2222-2222-2222-222222222222', 'SHERAZ-01', 'Sheraz Coach', 'Sheraz Transport Co.', 'Local Mini Bus / Coach', 'STAGE_BASED', 20, 100);
""")

sql.append('-- Stops for Sheraz Coach')
shz_stops_map = {}
for s in shz['canonical_stops']:
    seq = s['sequence']
    code = s['stop_id']
    name = s['official_name'].replace("'", "''")
    lat = s['coordinates']['lat']
    lng = s['coordinates']['lng']
    term_str = 'true' if s.get('is_terminal', False) else 'false'
    uuid_str = f'22222222-2222-2222-2222-{seq:012d}'
    shz_stops_map[s['official_name']] = uuid_str
    sql.append(f"""INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('{uuid_str}', '22222222-2222-2222-2222-222222222222', '{code}', '{name}', {seq}, {lat}, {lng}, {term_str});""")
    for sub in s.get('sub_landmarks', []):
        csub = sub.replace("'", "''")
        sql.append(f"""INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('{uuid_str}', '{csub}');""")

sql.append('\n-- Aliases for Sheraz Coach dictionary')
for alias, target_name in shz['karachi_alias_dictionary'].items():
    if target_name in shz_stops_map:
        uuid_str = shz_stops_map[target_name]
        calias = alias.replace("'", "''")
        sql.append(f"""INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('{uuid_str}', '{calias}');""")

os.makedirs('supabase', exist_ok=True)
with open('supabase/seed.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql))
print('Successfully generated supabase/seed.sql')
