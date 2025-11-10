begin;

-- Nettoyage des anciennes données de simulation pour l'utilisateur ciblé
with target_sessions as (
  select id
  from public.training_sessions
  where user_id = '136e5f62-088e-48c8-abdf-ff3922c01910'
)
delete from public.training_session_sets tss
using public.training_session_exercises tse
where tss.session_exercise_id = tse.id
  and tse.session_id in (select id from target_sessions);

with target_sessions as (
  select id
  from public.training_sessions
  where user_id = '136e5f62-088e-48c8-abdf-ff3922c01910'
)
delete from public.training_session_exercises tse
where tse.session_id in (select id from target_sessions);

with target_sessions as (
  select id
  from public.training_sessions
  where user_id = '136e5f62-088e-48c8-abdf-ff3922c01910'
)
delete from public.training_sessions ts
where ts.id in (select id from target_sessions);

delete from public.training_rows tr
where tr.user_id = '136e5f62-088e-48c8-abdf-ff3922c01910';

delete from public.trainings t
where t.user_id = '136e5f62-088e-48c8-abdf-ff3922c01910';

delete from public.programs p
where p.user_id = '136e5f62-088e-48c8-abdf-ff3922c01910';

delete from public.dashboard_preferences dp
where dp.user_id = '136e5f62-088e-48c8-abdf-ff3922c01910';

insert into public.preferences as pref (
  id,
  weight_unit,
  curve,
  newsletter,
  newsletter_shop,
  newsletter_store,
  survey
)
values (
  '136e5f62-088e-48c8-abdf-ff3922c01910',
  'kg',
  'total_weight',
  true,
  false,
  false,
  true
)
on conflict (id) do update
set
  weight_unit = excluded.weight_unit,
  curve = excluded.curve,
  newsletter = excluded.newsletter,
  newsletter_shop = excluded.newsletter_shop,
  newsletter_store = excluded.newsletter_store,
  survey = excluded.survey;

-- Programmes et entraînements de démonstration
insert into public.programs (
  id,
  user_id,
  name,
  dashboard,
  position
) values
  ('4d1c58f3-0d34-4ec0-848d-b07f6d1d4b53', '136e5f62-088e-48c8-abdf-ff3922c01910', 'Force Hypertrophie 8 semaines', true, 0),
  ('7b8ae897-f5f3-4ca5-8891-35b6118cb07a', '136e5f62-088e-48c8-abdf-ff3922c01910', 'Conditioning Métabolique', true, 1);

insert into public.trainings (
  id,
  user_id,
  program_id,
  name,
  position,
  app
) values
  ('d9ddba0b-1552-4aeb-b94f-05d4953ea055', '136e5f62-088e-48c8-abdf-ff3922c01910', '4d1c58f3-0d34-4ec0-848d-b07f6d1d4b53', 'Séance Haut du corps', 0, false),
  ('4a7c2f2b-28ff-4d06-b79f-a54d9334374f', '136e5f62-088e-48c8-abdf-ff3922c01910', '4d1c58f3-0d34-4ec0-848d-b07f6d1d4b53', 'Séance Bas du corps', 1, false),
  ('1c964b4d-e6f4-4c6a-a674-5b2f0f3f5df4', '136e5f62-088e-48c8-abdf-ff3922c01910', '7b8ae897-f5f3-4ca5-8891-35b6118cb07a', 'Metcon 30 minutes', 0, true);

-- Exercices associés aux entraînements
insert into public.training_rows (
  id,
  training_id,
  user_id,
  "order",
  series,
  repetitions,
  poids,
  repos,
  effort,
  checked,
  exercice,
  materiel,
  superset_id,
  link,
  note
) values
  ('2f1c8e3b-995f-4c30-8e7d-bec470f04ec7', 'd9ddba0b-1552-4aeb-b94f-05d4953ea055', '136e5f62-088e-48c8-abdf-ff3922c01910', 1, 4, ARRAY['6','6','6','6'], ARRAY['92.5','95','97.5','100'], '150', ARRAY['7','7','8','9'], false, 'Back Squat', 'Barre olympique', null, 'https://youtu.be/squat-demo', 'Accent sur la vitesse concentrique.'),
  ('63a5fd4d-564b-47d0-95db-90b8b9d5a2d8', 'd9ddba0b-1552-4aeb-b94f-05d4953ea055', '136e5f62-088e-48c8-abdf-ff3922c01910', 2, 4, ARRAY['8','8','8','8'], ARRAY['70','72.5','75','77.5'], '120', ARRAY['6','7','7','8'], false, 'Développé couché', 'Barre + rack', null, 'https://youtu.be/bench-demo', 'Pieds bien ancrés.'),
  ('f4b59ce8-5ecc-4fc4-bdb1-90df298108e7', 'd9ddba0b-1552-4aeb-b94f-05d4953ea055', '136e5f62-088e-48c8-abdf-ff3922c01910', 3, 3, ARRAY['10','10','10'], ARRAY['32','34','36'], '90', ARRAY['5','6','6'], false, 'Rowing unilatéral haltère', 'Banc incliné + haltère', null, null, 'Maintenir le dos gainé.'),
  ('c2a7d042-bf53-4f58-a2e2-45763f4eaef7', '4a7c2f2b-28ff-4d06-b79f-a54d9334374f', '136e5f62-088e-48c8-abdf-ff3922c01910', 1, 4, ARRAY['5','5','5','5'], ARRAY['110','115','120','122.5'], '180', ARRAY['7','8','8','9'], false, 'Soulevé de terre', 'Barre olympique', null, 'https://youtu.be/deadlift-demo', 'Pré-activer les ischios.'),
  ('f8984d54-8679-4c55-ac20-0da7a5636cee', '4a7c2f2b-28ff-4d06-b79f-a54d9334374f', '136e5f62-088e-48c8-abdf-ff3922c01910', 2, 3, ARRAY['10','10','10'], ARRAY['18','18','18'], '75', ARRAY['6','6','6'], false, 'Fentes marchées', 'Haltères', null, null, 'Grande amplitude.'),
  ('3949fb40-2e85-498c-a3a1-2f9d3609105f', '4a7c2f2b-28ff-4d06-b79f-a54d9334374f', '136e5f62-088e-48c8-abdf-ff3922c01910', 3, 3, ARRAY['12','12','12'], ARRAY['40','42','44'], '60', ARRAY['6','7','7'], false, 'Hip Thrust', 'Barre + banc', null, null, 'Poussée explosive.'),
  ('f6e33e4d-7a9d-45c1-84d3-f96f2b8f2a0d', '1c964b4d-e6f4-4c6a-a674-5b2f0f3f5df4', '136e5f62-088e-48c8-abdf-ff3922c01910', 1, 5, ARRAY['60','60','60','60','60'], ARRAY['0','0','0','0','0'], '0', ARRAY['8','8','8','8','8'], false, 'Circuit rameur + burpees', 'Rameur + poids du corps', null, null, 'Maintenir le rythme.'),
  ('8fd8bb89-3c5f-4401-bca5-0251f4728561', '1c964b4d-e6f4-4c6a-a674-5b2f0f3f5df4', '136e5f62-088e-48c8-abdf-ff3922c01910', 2, 4, ARRAY['45','45','45','45'], ARRAY['16','16','16','16'], '45', ARRAY['7','7','8','8'], false, 'Battle rope', 'Cordes ondulatoires', null, null, 'Intervalles 40"/20".');

-- Sessions d'entraînement réelles pour alimenter les graphiques
insert into public.training_sessions (
  id,
  user_id,
  program_id,
  training_id,
  performed_at,
  created_at,
  updated_at
) values
  ('f0c1d29c-7e9a-4cf7-9323-19a4f3a58c2d', '136e5f62-088e-48c8-abdf-ff3922c01910', '4d1c58f3-0d34-4ec0-848d-b07f6d1d4b53', 'd9ddba0b-1552-4aeb-b94f-05d4953ea055', '2025-02-10T18:30:00Z', '2025-02-10T18:30:00Z', '2025-02-10T18:30:00Z'),
  ('1b6d9b8f-ff25-4941-a9cf-1495fc1cfe8e', '136e5f62-088e-48c8-abdf-ff3922c01910', '4d1c58f3-0d34-4ec0-848d-b07f6d1d4b53', 'd9ddba0b-1552-4aeb-b94f-05d4953ea055', '2025-02-17T18:15:00Z', '2025-02-17T18:15:00Z', '2025-02-17T18:15:00Z'),
  ('abc08b49-998b-4fb1-8ac1-3e0f02b22a4b', '136e5f62-088e-48c8-abdf-ff3922c01910', '4d1c58f3-0d34-4ec0-848d-b07f6d1d4b53', 'd9ddba0b-1552-4aeb-b94f-05d4953ea055', '2025-02-24T18:20:00Z', '2025-02-24T18:20:00Z', '2025-02-24T18:20:00Z'),
  ('36d1f24f-39ff-4a9b-9261-df3901a36804', '136e5f62-088e-48c8-abdf-ff3922c01910', '4d1c58f3-0d34-4ec0-848d-b07f6d1d4b53', '4a7c2f2b-28ff-4d06-b79f-a54d9334374f', '2025-02-13T18:00:00Z', '2025-02-13T18:00:00Z', '2025-02-13T18:00:00Z'),
  ('b0cb6b23-9a55-4639-aae2-6f7a1c5a1b45', '136e5f62-088e-48c8-abdf-ff3922c01910', '4d1c58f3-0d34-4ec0-848d-b07f6d1d4b53', '4a7c2f2b-28ff-4d06-b79f-a54d9334374f', '2025-02-20T17:55:00Z', '2025-02-20T17:55:00Z', '2025-02-20T17:55:00Z'),
  ('c9d2c63f-0e3d-4a0c-90f3-68cf13bf2f2f', '136e5f62-088e-48c8-abdf-ff3922c01910', '7b8ae897-f5f3-4ca5-8891-35b6118cb07a', '1c964b4d-e6f4-4c6a-a674-5b2f0f3f5df4', '2025-02-15T10:30:00Z', '2025-02-15T10:30:00Z', '2025-02-15T10:30:00Z');

insert into public.training_session_exercises (
  id,
  session_id,
  training_row_id,
  exercise_name,
  position,
  created_at,
  updated_at
) values
  ('6b45f02e-3d2f-4e12-a812-551f9aeb8e2f', 'f0c1d29c-7e9a-4cf7-9323-19a4f3a58c2d', '2f1c8e3b-995f-4c30-8e7d-bec470f04ec7', 'Back Squat', 1, '2025-02-10T18:30:00Z', '2025-02-10T18:30:00Z'),
  ('c072a262-4e6c-4c48-9f90-486d2d97f4d9', 'f0c1d29c-7e9a-4cf7-9323-19a4f3a58c2d', '63a5fd4d-564b-47d0-95db-90b8b9d5a2d8', 'Développé couché', 2, '2025-02-10T18:30:00Z', '2025-02-10T18:30:00Z'),
  ('b5e34d0e-0991-4755-8de7-3125f862b0a4', 'f0c1d29c-7e9a-4cf7-9323-19a4f3a58c2d', 'f4b59ce8-5ecc-4fc4-bdb1-90df298108e7', 'Rowing unilatéral haltère', 3, '2025-02-10T18:30:00Z', '2025-02-10T18:30:00Z'),
  ('e67d87f7-6927-4f02-b4fa-0f262518fe79', '1b6d9b8f-ff25-4941-a9cf-1495fc1cfe8e', '2f1c8e3b-995f-4c30-8e7d-bec470f04ec7', 'Back Squat', 1, '2025-02-17T18:15:00Z', '2025-02-17T18:15:00Z'),
  ('c8a1fd7a-0b96-45cb-9ea7-d71f5f04c145', '1b6d9b8f-ff25-4941-a9cf-1495fc1cfe8e', '63a5fd4d-564b-47d0-95db-90b8b9d5a2d8', 'Développé couché', 2, '2025-02-17T18:15:00Z', '2025-02-17T18:15:00Z'),
  ('4f4a0bb0-7714-4ab5-8ba4-4ef38e9f20c7', '1b6d9b8f-ff25-4941-a9cf-1495fc1cfe8e', 'f4b59ce8-5ecc-4fc4-bdb1-90df298108e7', 'Rowing unilatéral haltère', 3, '2025-02-17T18:15:00Z', '2025-02-17T18:15:00Z'),
  ('b8a8ce6c-82d8-46de-8c19-cb9edc4d0eab', 'abc08b49-998b-4fb1-8ac1-3e0f02b22a4b', '2f1c8e3b-995f-4c30-8e7d-bec470f04ec7', 'Back Squat', 1, '2025-02-24T18:20:00Z', '2025-02-24T18:20:00Z'),
  ('87f9cf4a-cd6a-4ef7-9dfa-91b9b728d418', 'abc08b49-998b-4fb1-8ac1-3e0f02b22a4b', '63a5fd4d-564b-47d0-95db-90b8b9d5a2d8', 'Développé couché', 2, '2025-02-24T18:20:00Z', '2025-02-24T18:20:00Z'),
  ('a80fda26-289d-4d35-9451-61713e4189b9', 'abc08b49-998b-4fb1-8ac1-3e0f02b22a4b', 'f4b59ce8-5ecc-4fc4-bdb1-90df298108e7', 'Rowing unilatéral haltère', 3, '2025-02-24T18:20:00Z', '2025-02-24T18:20:00Z'),
  ('dd598ddc-1a26-409f-9e79-40fe4f7ccf5c', '36d1f24f-39ff-4a9b-9261-df3901a36804', 'c2a7d042-bf53-4f58-a2e2-45763f4eaef7', 'Soulevé de terre', 1, '2025-02-13T18:00:00Z', '2025-02-13T18:00:00Z'),
  ('f097f6f0-31a5-44f4-8c5f-34656d55c956', '36d1f24f-39ff-4a9b-9261-df3901a36804', 'f8984d54-8679-4c55-ac20-0da7a5636cee', 'Fentes marchées', 2, '2025-02-13T18:00:00Z', '2025-02-13T18:00:00Z'),
  ('2279ef4f-bbf6-4fd0-8a9e-9f1f6d66ad5f', '36d1f24f-39ff-4a9b-9261-df3901a36804', '3949fb40-2e85-498c-a3a1-2f9d3609105f', 'Hip Thrust', 3, '2025-02-13T18:00:00Z', '2025-02-13T18:00:00Z'),
  ('d38e825f-3d0e-4321-8f50-b888494450c4', 'b0cb6b23-9a55-4639-aae2-6f7a1c5a1b45', 'c2a7d042-bf53-4f58-a2e2-45763f4eaef7', 'Soulevé de terre', 1, '2025-02-20T17:55:00Z', '2025-02-20T17:55:00Z'),
  ('f0c21c76-9dc1-4a96-9c1f-4b615e3a0a59', 'b0cb6b23-9a55-4639-aae2-6f7a1c5a1b45', 'f8984d54-8679-4c55-ac20-0da7a5636cee', 'Fentes marchées', 2, '2025-02-20T17:55:00Z', '2025-02-20T17:55:00Z'),
  ('1fbdc4d9-27d9-46d1-bfeb-4bf03f1e5ce5', 'b0cb6b23-9a55-4639-aae2-6f7a1c5a1b45', '3949fb40-2e85-498c-a3a1-2f9d3609105f', 'Hip Thrust', 3, '2025-02-20T17:55:00Z', '2025-02-20T17:55:00Z'),
  ('a9d87241-9160-4c3f-a0f2-f56b23590d06', 'c9d2c63f-0e3d-4a0c-90f3-68cf13bf2f2f', 'f6e33e4d-7a9d-45c1-84d3-f96f2b8f2a0d', 'Circuit rameur + burpees', 1, '2025-02-15T10:30:00Z', '2025-02-15T10:30:00Z'),
  ('7c5b6a3e-0d52-4a5a-8c4f-6bdca0bf4a4a', 'c9d2c63f-0e3d-4a0c-90f3-68cf13bf2f2f', '8fd8bb89-3c5f-4401-bca5-0251f4728561', 'Battle rope', 2, '2025-02-15T10:30:00Z', '2025-02-15T10:30:00Z');

insert into public.training_session_sets (
  id,
  session_exercise_id,
  set_number,
  repetitions,
  weights,
  created_at,
  updated_at
) values
  ('9c4e6f35-6ec5-47f0-9e55-cc8cd3b8a570', '6b45f02e-3d2f-4e12-a812-551f9aeb8e2f', 1, 4, ARRAY[95,95,95,95]::numeric[], '2025-02-10T18:30:00Z', '2025-02-10T18:30:00Z'),
  ('1c62a7e7-0da5-457d-8c79-3df0c63d4cfe', '6b45f02e-3d2f-4e12-a812-551f9aeb8e2f', 2, 4, ARRAY[97.5,97.5,97.5,97.5]::numeric[], '2025-02-10T18:35:00Z', '2025-02-10T18:35:00Z'),
  ('5f2b4c15-1f2d-4e84-b64e-5359aa66d7f9', '6b45f02e-3d2f-4e12-a812-551f9aeb8e2f', 3, 4, ARRAY[100,100,100,100]::numeric[], '2025-02-10T18:40:00Z', '2025-02-10T18:40:00Z'),
  ('e5cf9927-15cc-4a77-a2f4-95840f9baf1f', 'c072a262-4e6c-4c48-9f90-486d2d97f4d9', 1, 6, ARRAY[72.5,72.5,72.5,72.5,72.5,72.5]::numeric[], '2025-02-10T18:45:00Z', '2025-02-10T18:45:00Z'),
  ('8b6b8673-1e91-4e44-8d53-82bff34f7b6d', 'c072a262-4e6c-4c48-9f90-486d2d97f4d9', 2, 6, ARRAY[75,75,75,75,75,75]::numeric[], '2025-02-10T18:50:00Z', '2025-02-10T18:50:00Z'),
  ('3bc77d5a-c251-4a1d-9f36-33fb801b8877', 'b5e34d0e-0991-4755-8de7-3125f862b0a4', 1, 10, ARRAY[34,34,34,34,34,34,34,34,34,34]::numeric[], '2025-02-10T18:55:00Z', '2025-02-10T18:55:00Z'),
  ('7d23b0c8-2c26-4b8c-9465-cc6489a1a5ea', 'b5e34d0e-0991-4755-8de7-3125f862b0a4', 2, 10, ARRAY[36,36,36,36,36,36,36,36,36,36]::numeric[], '2025-02-10T19:00:00Z', '2025-02-10T19:00:00Z'),
  ('f7774730-8c1c-4b97-88aa-51c1b5cf26a1', 'e67d87f7-6927-4f02-b4fa-0f262518fe79', 1, 4, ARRAY[97.5,97.5,97.5,97.5]::numeric[], '2025-02-17T18:15:00Z', '2025-02-17T18:15:00Z'),
  ('d2cbf025-9ca2-4b63-8c75-ff6a6203a957', 'e67d87f7-6927-4f02-b4fa-0f262518fe79', 2, 4, ARRAY[100,100,100,100]::numeric[], '2025-02-17T18:20:00Z', '2025-02-17T18:20:00Z'),
  ('6c7be968-6e5d-4b88-b5f0-f6a236a2257e', 'c8a1fd7a-0b96-45cb-9ea7-d71f5f04c145', 1, 6, ARRAY[75,75,75,75,75,75]::numeric[], '2025-02-17T18:25:00Z', '2025-02-17T18:25:00Z'),
  ('aa451104-5d8d-4d0c-9e2f-2d0b4f1f27f9', 'c8a1fd7a-0b96-45cb-9ea7-d71f5f04c145', 2, 6, ARRAY[77.5,77.5,77.5,77.5,77.5,77.5]::numeric[], '2025-02-17T18:30:00Z', '2025-02-17T18:30:00Z'),
  ('6c989eef-0a6f-46e5-b773-8c38906d5d53', '4f4a0bb0-7714-4ab5-8ba4-4ef38e9f20c7', 1, 10, ARRAY[34,34,34,34,34,34,34,34,34,34]::numeric[], '2025-02-17T18:35:00Z', '2025-02-17T18:35:00Z'),
  ('bcfe39a3-f56e-44a7-9c39-1f9f3fb8ef51', '4f4a0bb0-7714-4ab5-8ba4-4ef38e9f20c7', 2, 10, ARRAY[36,36,36,36,36,36,36,36,36,36]::numeric[], '2025-02-17T18:40:00Z', '2025-02-17T18:40:00Z'),
  ('c37ea8e6-79a7-4ff6-a9be-4d210b5080a2', 'b8a8ce6c-82d8-46de-8c19-cb9edc4d0eab', 1, 4, ARRAY[100,100,100,100]::numeric[], '2025-02-24T18:20:00Z', '2025-02-24T18:20:00Z'),
  ('a1d5aa39-7c99-4d62-8748-22a50c593ad2', 'b8a8ce6c-82d8-46de-8c19-cb9edc4d0eab', 2, 4, ARRAY[102.5,102.5,102.5,102.5]::numeric[], '2025-02-24T18:25:00Z', '2025-02-24T18:25:00Z'),
  ('0e4050c8-5ff6-46e7-9a72-3f9b1a8d3b9e', '87f9cf4a-cd6a-4ef7-9dfa-91b9b728d418', 1, 6, ARRAY[77.5,77.5,77.5,77.5,77.5,77.5]::numeric[], '2025-02-24T18:30:00Z', '2025-02-24T18:30:00Z'),
  ('82633a5b-897a-45ea-bf13-9f967e8c0ddf', '87f9cf4a-cd6a-4ef7-9dfa-91b9b728d418', 2, 6, ARRAY[80,80,80,80,80,80]::numeric[], '2025-02-24T18:35:00Z', '2025-02-24T18:35:00Z'),
  ('f13c0d76-6445-4d47-8f2c-8a01bf908e6f', 'a80fda26-289d-4d35-9451-61713e4189b9', 1, 10, ARRAY[36,36,36,36,36,36,36,36,36,36]::numeric[], '2025-02-24T18:40:00Z', '2025-02-24T18:40:00Z'),
  ('d6c5edc2-6fa1-4d3a-84f1-527c4c4cf8ac', 'a80fda26-289d-4d35-9451-61713e4189b9', 2, 10, ARRAY[38,38,38,38,38,38,38,38,38,38]::numeric[], '2025-02-24T18:45:00Z', '2025-02-24T18:45:00Z'),
  ('74eea173-2461-4ff7-b5dd-aba8e2f2683d', 'dd598ddc-1a26-409f-9e79-40fe4f7ccf5c', 1, 3, ARRAY[115,115,115]::numeric[], '2025-02-13T18:00:00Z', '2025-02-13T18:00:00Z'),
  ('ba59f208-49cf-4a40-b9d5-50c05f9e2c20', 'dd598ddc-1a26-409f-9e79-40fe4f7ccf5c', 2, 3, ARRAY[120,120,120]::numeric[], '2025-02-13T18:05:00Z', '2025-02-13T18:05:00Z'),
  ('b06ad5e8-93e5-4c7c-8d54-1c8b43f5bb3c', 'f097f6f0-31a5-44f4-8c5f-34656d55c956', 1, 10, ARRAY[20,20,20,20,20,20,20,20,20,20]::numeric[], '2025-02-13T18:10:00Z', '2025-02-13T18:10:00Z'),
  ('8d5c63f2-2222-4233-b7a8-4878b9c15f1f', 'f097f6f0-31a5-44f4-8c5f-34656d55c956', 2, 10, ARRAY[22,22,22,22,22,22,22,22,22,22]::numeric[], '2025-02-13T18:15:00Z', '2025-02-13T18:15:00Z'),
  ('c8030f40-4b91-4f2f-8f48-b06e9c54b93a', '2279ef4f-bbf6-4fd0-8a9e-9f1f6d66ad5f', 1, 12, ARRAY[40,40,40,40,40,40,40,40,40,40,40,40]::numeric[], '2025-02-13T18:20:00Z', '2025-02-13T18:20:00Z'),
  ('5f08f4c4-6316-4f6f-9bfa-4c083e090e5c', '2279ef4f-bbf6-4fd0-8a9e-9f1f6d66ad5f', 2, 12, ARRAY[42,42,42,42,42,42,42,42,42,42,42,42]::numeric[], '2025-02-13T18:25:00Z', '2025-02-13T18:25:00Z'),
  ('c9f96d73-6bd5-4f18-9b48-dad6f0584c34', 'd38e825f-3d0e-4321-8f50-b888494450c4', 1, 3, ARRAY[120,120,120]::numeric[], '2025-02-20T17:55:00Z', '2025-02-20T17:55:00Z'),
  ('6a1d2700-1d47-4db7-8d91-1a64eab2a3e5', 'd38e825f-3d0e-4321-8f50-b888494450c4', 2, 3, ARRAY[122.5,122.5,122.5]::numeric[], '2025-02-20T18:00:00Z', '2025-02-20T18:00:00Z'),
  ('dc62b1e5-b2c6-40a9-a651-46fd8c1442fa', 'f0c21c76-9dc1-4a96-9c1f-4b615e3a0a59', 1, 10, ARRAY[20,20,20,20,20,20,20,20,20,20]::numeric[], '2025-02-20T18:05:00Z', '2025-02-20T18:05:00Z'),
  ('b591a531-1ee3-40cb-8a84-429e60e08b5d', 'f0c21c76-9dc1-4a96-9c1f-4b615e3a0a59', 2, 10, ARRAY[22,22,22,22,22,22,22,22,22,22]::numeric[], '2025-02-20T18:10:00Z', '2025-02-20T18:10:00Z'),
  ('8fd0e7ab-4e1d-4f3a-9a2f-59fc65fb2983', '1fbdc4d9-27d9-46d1-bfeb-4bf03f1e5ce5', 1, 12, ARRAY[42,42,42,42,42,42,42,42,42,42,42,42]::numeric[], '2025-02-20T18:15:00Z', '2025-02-20T18:15:00Z'),
  ('34e7a5f7-9171-40ce-9d74-c60d5731a032', '1fbdc4d9-27d9-46d1-bfeb-4bf03f1e5ce5', 2, 12, ARRAY[44,44,44,44,44,44,44,44,44,44,44,44]::numeric[], '2025-02-20T18:20:00Z', '2025-02-20T18:20:00Z'),
  ('b4e34c5a-7d5d-4877-a873-b7c6dc7c0f06', 'a9d87241-9160-4c3f-a0f2-f56b23590d06', 1, 60, ARRAY[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]::numeric[], '2025-02-15T10:30:00Z', '2025-02-15T10:30:00Z'),
  ('a4cf2cb1-c6fb-41f1-869c-50507a1fcc27', '7c5b6a3e-0d52-4a5a-8c4f-6bdca0bf4a4a', 1, 20, ARRAY[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]::numeric[], '2025-02-15T10:35:00Z', '2025-02-15T10:35:00Z'),
  ('e3af34ac-64a8-4db8-8a7a-9bf365020f5f', '7c5b6a3e-0d52-4a5a-8c4f-6bdca0bf4a4a', 2, 20, ARRAY[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]::numeric[], '2025-02-15T10:40:00Z', '2025-02-15T10:40:00Z');

-- Préférences du tableau de bord
insert into public.dashboard_preferences as dp (
  user_id,
  selected_program_id,
  selected_training_id,
  selected_exercise_id,
  exercise_settings,
  show_stats,
  updated_at
) values (
  '136e5f62-088e-48c8-abdf-ff3922c01910',
  '4d1c58f3-0d34-4ec0-848d-b07f6d1d4b53',
  'd9ddba0b-1552-4aeb-b94f-05d4953ea055',
  '2f1c8e3b-995f-4c30-8e7d-bec470f04ec7',
  '{"selectedExerciseId":"2f1c8e3b-995f-4c30-8e7d-bec470f04ec7","exercises":{"2f1c8e3b-995f-4c30-8e7d-bec470f04ec7":{"sessionCount":"10","curveType":"poids-maximum"},"63a5fd4d-564b-47d0-95db-90b8b9d5a2d8":{"sessionCount":"5","curveType":"poids-total"}}}'::jsonb,
  true,
  now()
)
on conflict (user_id) do update
set
  selected_program_id = excluded.selected_program_id,
  selected_training_id = excluded.selected_training_id,
  selected_exercise_id = excluded.selected_exercise_id,
  exercise_settings = excluded.exercise_settings,
  show_stats = excluded.show_stats,
  updated_at = excluded.updated_at;

commit;
