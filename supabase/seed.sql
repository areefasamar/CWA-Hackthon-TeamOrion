-- ==============================================================================
-- Karachi Transit AI: Seed Data for Phase 1
-- Route 1 (Peoples Bus Service EV-1) + Sheraz Coach
-- ==============================================================================

TRUNCATE public.stop_aliases, public.stops, public.routes CASCADE;

-- Route 1: Peoples Bus Service
INSERT INTO public.routes (id, route_code, name, operator, fleet_type, fare_type, base_fare_pkr, max_fare_pkr)
VALUES ('11111111-1111-1111-1111-111111111111', 'PBS-01', 'Peoples Bus Service - Route 1 (EV-1)', 'Peoples Bus Service', 'Electric AC', 'FLAT', 50, 50);

-- Stops for Route 1
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('11111111-1111-1111-1111-000000000001', '11111111-1111-1111-1111-111111111111', 'ST-01', 'Model Colony', 1, 24.8992, 67.1865, true);
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('11111111-1111-1111-1111-000000000002', '11111111-1111-1111-1111-111111111111', 'ST-02', 'Malir Halt', 2, 24.892, 67.1684, false);
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('11111111-1111-1111-1111-000000000003', '11111111-1111-1111-1111-111111111111', 'ST-03', 'Star Gate', 3, 24.8872, 67.1512, false);
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('11111111-1111-1111-1111-000000000004', '11111111-1111-1111-1111-111111111111', 'ST-04', 'Drigh Road Station', 4, 24.8789, 67.1265, false);
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('11111111-1111-1111-1111-000000000005', '11111111-1111-1111-1111-111111111111', 'ST-05', 'Karsaz', 5, 24.8722, 67.0988, false);
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('11111111-1111-1111-1111-000000000006', '11111111-1111-1111-1111-111111111111', 'ST-06', 'Baloch Colony', 6, 24.8654, 67.0782, false);
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('11111111-1111-1111-1111-000000000007', '11111111-1111-1111-1111-111111111111', 'ST-07', 'Nursery', 7, 24.858, 67.062, false);
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('11111111-1111-1111-1111-000000000008', '11111111-1111-1111-1111-111111111111', 'ST-08', 'FTC', 8, 24.854, 67.0505, false);
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('11111111-1111-1111-1111-000000000009', '11111111-1111-1111-1111-111111111111', 'ST-09', 'Metropole Hotel', 9, 24.8505, 67.0315, false);
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('11111111-1111-1111-1111-000000000010', '11111111-1111-1111-1111-111111111111', 'ST-10', 'Arts Council', 10, 24.8548, 67.018, false);
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('11111111-1111-1111-1111-000000000011', '11111111-1111-1111-1111-111111111111', 'ST-11', 'Tower', 11, 24.853, 66.9995, true);

-- Aliases for Route 1
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000003', 'airport');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000003', 'jinnah international');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000003', 'star gate');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000004', 'drig road');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000004', 'drigh road station');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000004', 'lal kothi');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000005', 'karsaz chowrangi');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000005', 'national stadium turn');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000007', 'pechs');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000007', 'nursery');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000008', 'ftc building');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000008', 'ftc');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000009', 'metropol');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000009', 'avari');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000009', 'saddar club road');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000010', 'arts council');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000010', 'sindh assembly');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000011', 'tower');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000011', 'kharadar');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000011', 'merewether clock tower');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000001', 'model colony');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000002', 'malir halt');
INSERT INTO public.stop_aliases (stop_id, alias_name)
VALUES ('11111111-1111-1111-1111-000000000006', 'baloch colony');

-- Route 2: Sheraz Coach
INSERT INTO public.routes (id, route_code, name, operator, fleet_type, fare_type, base_fare_pkr, max_fare_pkr)
VALUES ('22222222-2222-2222-2222-222222222222', 'SHERAZ-01', 'Sheraz Coach', 'Sheraz Transport Co.', 'Local Mini Bus / Coach', 'STAGE_BASED', 20, 100);

-- Stops for Sheraz Coach
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000001', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-01', 'CP 06 Malir Cantt', 1, 24.9351, 67.1895, true);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000001', 'Check Post 6');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000001', 'Malir Cantt Gate 6');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000001', 'Piccadilly');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000001', 'Cinema Chowk');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000002', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-02', 'Safoora Chowrangi', 2, 24.9458, 67.1478, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000002', 'Safoora');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000002', 'Safoora Goth');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000002', 'Safoora Chowk');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000003', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-03', 'Bin Hashim / NADRA Office', 3, 24.9432, 67.1352, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000003', 'Bin Hashim Supermarket');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000003', 'NADRA Executive Center Safoora');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000003', 'Supermarket Strip');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000004', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-04', 'Mausamiyat', 4, 24.9401, 67.1265, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000004', 'Mosamiyat');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000004', 'Mausamiyat Chowrangi');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000004', 'Meteorological Department');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000005', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-05', 'Dow / Ojha Campus', 5, 24.9372, 67.1211, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000005', 'Dow University');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000005', 'Ojha Hospital');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000005', 'DUHS Ojha');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000006', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-06', 'KU Main Gate', 6, 24.9348, 67.1162, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000006', 'Karachi University');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000006', 'KU Gate');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000006', 'Sheikh Zayed Islamic Centre');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000006', 'SUPARCO');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000007', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-07', 'NED University', 7, 24.9315, 67.1118, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000007', 'NED');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000007', 'NED Main Gate');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000007', 'NED Chowrangi');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000008', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-08', 'Safari Park', 8, 24.9248, 67.1035, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000008', 'Safari Park Gate');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000008', 'University Road Safari');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000009', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-09', 'NIPA Chowrangi', 9, 24.9178, 67.0971, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000009', 'N.I.P.A');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000009', 'Nipa Bridge');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000009', 'Nipa Pul');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000009', 'Gulshan Block 6');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000010', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-10', 'Urdu Science College', 10, 24.9112, 67.0883, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000010', 'Federal Urdu University');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000010', 'Urdu College');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000010', 'Gulshan Block 13');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000011', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-11', 'Hassan Square', 11, 24.9031, 67.0789, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000011', 'Hasan Square');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000011', 'Expo Centre Karachi');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000011', 'Civic Centre');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000012', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-12', 'Sabzi Mandi / Askari Park', 12, 24.898, 67.0698, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000012', 'Purani Sabzi Mandi');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000012', 'Askari Amusement Park');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000012', 'Kashmir Road Extension');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000013', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-13', 'Jail Chowrangi', 13, 24.8903, 67.0581, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000013', 'Jail Road');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000013', 'Central Jail Karachi');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000013', 'PIB Colony Entrance');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000014', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-14', 'Mazar-e-Quaid', 14, 24.8746, 67.0398, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000014', 'Quaid Tomb');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000014', 'Mazar Sharif');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000014', 'PP Chowrangi');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000015', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-15', 'Old Numaish', 15, 24.8712, 67.0321, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000015', 'Numaish');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000015', 'Numaish Chowrangi');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000015', 'BRT Green Line Numaish');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000016', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-16', 'Plaza / MA Jinnah Road', 16, 24.8633, 67.0215, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000016', 'Bunder Road');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000016', 'Bander Road');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000016', 'Plaza Cinema');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000016', 'Radio Pakistan');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000017', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-17', 'Jama Cloth Market', 17, 24.8581, 67.0142, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000017', 'Jama Cloth');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000017', 'Lighthouse Market');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000018', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-18', 'Denso Hall', 18, 24.8532, 67.0089, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000018', 'Dhanji Hall');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000018', 'MA Jinnah Wholesale Market');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000019', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-19', 'Boulton Market', 19, 24.8504, 67.0041, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000019', 'Bolton Market');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000019', 'Kharadar Entrance');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000020', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-20', 'Tower', 20, 24.8489, 67.0019, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000020', 'Merewether Tower');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000020', 'Custom House');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000020', 'Kharadar');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000021', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-21', 'Jamat Khana', 21, 24.8461, 66.995, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000021', 'Kharadar Jamatkhana');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000021', 'Ismaili Jamatkhana');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000021', 'Aga Khan Road');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000022', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-22', 'G. Allana Road', 22, 24.8422, 66.9881, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000022', 'Ghulam Ali Allana Road');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000022', 'G Alana Road');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000022', 'Machli Miyani');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000023', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-23', 'Gulbai', 23, 24.8495, 66.9654, false);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000023', 'Gulbai Chowrangi');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000023', 'SITE South');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000023', 'Mauripur Road Start');
INSERT INTO public.stops (id, route_id, stop_code, name, sequence_number, lat, lng, is_terminal)
VALUES ('22222222-2222-2222-2222-000000000024', '22222222-2222-2222-2222-222222222222', 'SHZ-STP-24', 'Hawksbay', 24, 24.8512, 66.8621, true);
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000024', 'Hawks Bay Beach');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000024', 'Kakapir');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000024', 'Hawksbay Truck Stand');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000024', 'Mauripur');

-- Aliases for Sheraz Coach dictionary
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000020', 'Tower / Kharadar');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000001', 'cp 6');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000001', 'cp6');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000001', 'check post 6');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000001', 'malir cantt gate 6');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000001', 'piccadilly');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000001', 'cinema chowk');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000002', 'safoora');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000002', 'safoora goth');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000003', 'bin hashim');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000003', 'nadra office');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000003', 'nadra office safoora');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000004', 'mosmiyat');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000004', 'mosamiyat');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000005', 'dow');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000005', 'ojha');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000005', 'dow University');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000005', 'duhs');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000006', 'ku');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000006', 'karachi university');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000006', 'sheikh zaid');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000006', 'suparco');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000007', 'ned');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000007', 'ned university');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000008', 'safari park');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000009', 'nipa');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000009', 'n.i.p.a');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000009', 'nipa pul');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000010', 'urdu science college');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000010', 'urdu college');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000011', 'hasan square');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000011', 'hassan square');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000011', 'expo centre');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000011', 'civic centre');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000012', 'sabzi mandi');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000012', 'purani sabzi mandi');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000012', 'askari park');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000013', 'jail road');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000013', 'jail chowrangi');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000013', 'central jail');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000014', 'mazar e quaid');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000014', 'mazar');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000014', 'quaid mazar');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000015', 'numaish');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000015', 'old numaish');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000016', 'bander road');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000016', 'bunder road');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000016', 'plaza');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000017', 'jama cloth');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000018', 'denso hall');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000018', 'dhanji hall');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000019', 'boulton market');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000019', 'bolton market');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000020', 'tower');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000020', 'custom house');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000020', 'kharadar');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000021', 'jamat khana');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000022', 'g allana road');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000022', 'g. alana road');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000023', 'gulbai');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000024', 'hawksbay');
INSERT INTO public.stop_aliases (stop_id, alias_name) VALUES ('22222222-2222-2222-2222-000000000024', 'hawks bay');