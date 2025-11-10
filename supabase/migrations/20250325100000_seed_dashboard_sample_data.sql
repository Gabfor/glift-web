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

with session_source as (
  select
    gen_random_uuid() as session_id,
    '136e5f62-088e-48c8-abdf-ff3922c01910'::uuid as user_id,
    '4d1c58f3-0d34-4ec0-848d-b07f6d1d4b53'::uuid as program_id,
    'd9ddba0b-1552-4aeb-b94f-05d4953ea055'::uuid as training_id,
    gs as session_index,
    ('2024-10-07T18:30:00Z'::timestamptz + (gs - 1) * interval '7 days') as performed_at
  from generate_series(1, 15) as gs
  union all
  select
    gen_random_uuid() as session_id,
    '136e5f62-088e-48c8-abdf-ff3922c01910'::uuid as user_id,
    '4d1c58f3-0d34-4ec0-848d-b07f6d1d4b53'::uuid as program_id,
    '4a7c2f2b-28ff-4d06-b79f-a54d9334374f'::uuid as training_id,
    gs as session_index,
    ('2024-10-10T17:55:00Z'::timestamptz + (gs - 1) * interval '7 days') as performed_at
  from generate_series(1, 15) as gs
  union all
  select
    gen_random_uuid() as session_id,
    '136e5f62-088e-48c8-abdf-ff3922c01910'::uuid as user_id,
    '7b8ae897-f5f3-4ca5-8891-35b6118cb07a'::uuid as program_id,
    '1c964b4d-e6f4-4c6a-a674-5b2f0f3f5df4'::uuid as training_id,
    gs as session_index,
    ('2024-10-12T10:30:00Z'::timestamptz + (gs - 1) * interval '7 days') as performed_at
  from generate_series(1, 15) as gs
),
inserted_sessions as (
  insert into public.training_sessions (
    id,
    user_id,
    program_id,
    training_id,
    performed_at,
    created_at,
    updated_at
  )
  select
    session_id,
    user_id,
    program_id,
    training_id,
    performed_at,
    performed_at,
    performed_at
  from session_source
  returning id, training_id, performed_at
),
session_data as (
  select
    i.id,
    i.training_id,
    i.performed_at,
    s.session_index
  from inserted_sessions i
  join session_source s on s.training_id = i.training_id
    and s.performed_at = i.performed_at
),
exercise_metadata as (
  select *
  from (values
    ('2f1c8e3b-995f-4c30-8e7d-bec470f04ec7'::uuid, 'd9ddba0b-1552-4aeb-b94f-05d4953ea055'::uuid, 4, 5, 1, 92.5::numeric, 2.5::numeric, 1.25::numeric),
    ('63a5fd4d-564b-47d0-95db-90b8b9d5a2d8'::uuid, 'd9ddba0b-1552-4aeb-b94f-05d4953ea055'::uuid, 4, 6, 1, 72.5::numeric, 1.25::numeric, 0.5::numeric),
    ('f4b59ce8-5ecc-4fc4-bdb1-90df298108e7'::uuid, 'd9ddba0b-1552-4aeb-b94f-05d4953ea055'::uuid, 3, 10, 1, 32::numeric, 0.5::numeric, 0.5::numeric),
    ('c2a7d042-bf53-4f58-a2e2-45763f4eaef7'::uuid, '4a7c2f2b-28ff-4d06-b79f-a54d9334374f'::uuid, 4, 4, 1, 115::numeric, 3::numeric, 1.5::numeric),
    ('f8984d54-8679-4c55-ac20-0da7a5636cee'::uuid, '4a7c2f2b-28ff-4d06-b79f-a54d9334374f'::uuid, 3, 10, 2, 18::numeric, 0.5::numeric, 0.25::numeric),
    ('3949fb40-2e85-498c-a3a1-2f9d3609105f'::uuid, '4a7c2f2b-28ff-4d06-b79f-a54d9334374f'::uuid, 3, 12, 1, 40::numeric, 1::numeric, 0.5::numeric),
    ('f6e33e4d-7a9d-45c1-84d3-f96f2b8f2a0d'::uuid, '1c964b4d-e6f4-4c6a-a674-5b2f0f3f5df4'::uuid, 3, 55, 5, 0::numeric, 0::numeric, 0::numeric),
    ('8fd8bb89-3c5f-4401-bca5-0251f4728561'::uuid, '1c964b4d-e6f4-4c6a-a674-5b2f0f3f5df4'::uuid, 4, 22, 3, 0::numeric, 0::numeric, 0::numeric)
  ) as t(training_row_id, training_id, set_count, base_reps, rep_spread, base_weight, session_increment, set_increment)
),
exercise_templates as (
  select
    em.training_row_id,
    em.training_id,
    em.set_count,
    em.base_reps,
    em.rep_spread,
    em.base_weight,
    em.session_increment,
    em.set_increment,
    tr.exercice as exercise_name,
    tr."order" as position
  from exercise_metadata em
  join public.training_rows tr on tr.id = em.training_row_id
),
inserted_exercises as (
  insert into public.training_session_exercises (
    id,
    session_id,
    training_row_id,
    exercise_name,
    position,
    created_at,
    updated_at
  )
  select
    gen_random_uuid(),
    sd.id,
    et.training_row_id,
    et.exercise_name,
    et.position,
    sd.performed_at,
    sd.performed_at
  from session_data sd
  join exercise_templates et on et.training_id = sd.training_id
  returning id, session_id, training_row_id
)
insert into public.training_session_sets (
  id,
  session_exercise_id,
  set_number,
  repetitions,
  weights,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  ie.id,
  gs.set_number,
  calc.rep_count,
  array_fill(calc.weight_value, array[calc.rep_count])::numeric[],
  sd.performed_at + (gs.set_number - 1) * interval '5 minutes',
  sd.performed_at + (gs.set_number - 1) * interval '5 minutes'
from inserted_exercises ie
join session_data sd on sd.id = ie.session_id
join exercise_templates et on et.training_id = sd.training_id and et.training_row_id = ie.training_row_id
cross join lateral (
  select generate_series(1, et.set_count) as set_number
) as gs
cross join lateral (
  select
    greatest(
      1,
      et.base_reps + ((sd.session_index + gs.set_number) % (et.rep_spread * 2 + 1)) - et.rep_spread
    ) as rep_count,
    round(
      et.base_weight + (sd.session_index - 1) * et.session_increment + (gs.set_number - 1) * et.set_increment,
      1
    ) as weight_value
) as calc;
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
  '{"selectedExerciseId":"2f1c8e3b-995f-4c30-8e7d-bec470f04ec7","exercises":{"2f1c8e3b-995f-4c30-8e7d-bec470f04ec7":{"sessionCount":"15","curveType":"poids-maximum"},"63a5fd4d-564b-47d0-95db-90b8b9d5a2d8":{"sessionCount":"15","curveType":"poids-total"}}}'::jsonb,
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
