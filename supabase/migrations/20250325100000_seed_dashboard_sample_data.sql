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
  ('18151b49-20c6-4220-bd33-4b6643202372', '136e5f62-088e-48c8-abdf-ff3922c01910', 'Prise de masse', true, 0);

insert into public.trainings (
  id,
  user_id,
  program_id,
  name,
  position,
  app
) values
  ('9bf4f72b-9512-4c77-a408-8e142c784a46', '136e5f62-088e-48c8-abdf-ff3922c01910', '18151b49-20c6-4220-bd33-4b6643202372', 'Biceps & Triceps', 0, false),
  ('0238811d-e5a5-4878-84ba-08bab6d9b796', '136e5f62-088e-48c8-abdf-ff3922c01910', '18151b49-20c6-4220-bd33-4b6643202372', 'Pectoraux', 1, false);

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
  ('52fef4d1-c665-469c-b78c-1f484f83837a', '9bf4f72b-9512-4c77-a408-8e142c784a46', '136e5f62-088e-48c8-abdf-ff3922c01910', 1, 4, ARRAY['12','12','11','10'], ARRAY['20','22','25','28'], '90', ARRAY['7','7','8','8'], false, 'Curl debout', 'Haltères', null, null, 'Conserver les coudes fixes.'),
  ('ef89d65d-bba9-4d2b-a6c7-1a53954483a8', '9bf4f72b-9512-4c77-a408-8e142c784a46', '136e5f62-088e-48c8-abdf-ff3922c01910', 2, 4, ARRAY['12','12','11','10'], ARRAY['10','12','13','15'], '75', ARRAY['7','7','8','8'], false, 'Kick back', 'Haltères', null, null, 'Allonger l''avant-bras au maximum.'),
  ('ee10006e-06a7-4e44-b00b-740d32497fe8', '9bf4f72b-9512-4c77-a408-8e142c784a46', '136e5f62-088e-48c8-abdf-ff3922c01910', 3, 4, ARRAY['12','12','11','10'], ARRAY['15','16','18','20'], '90', ARRAY['7','8','8','8'], false, 'Curl alterné assis', 'Haltères', null, null, 'Montées contrôlées, descente lente.'),
  ('a29be77d-85bf-47c1-bf28-8257f6eafd88', '9bf4f72b-9512-4c77-a408-8e142c784a46', '136e5f62-088e-48c8-abdf-ff3922c01910', 4, 4, ARRAY['15','15','13','12'], ARRAY['0','0','0','0'], '90', ARRAY['7','8','8','9'], false, 'Dips', 'Poids du corps', null, null, 'Verrouiller les épaules.'),
  ('dbd2dc1d-7c76-4641-9c6f-2bd6a64f4700', '9bf4f72b-9512-4c77-a408-8e142c784a46', '136e5f62-088e-48c8-abdf-ff3922c01910', 5, 4, ARRAY['10','10','9','8'], ARRAY['15','17','18','20'], '75', ARRAY['7','7','8','9'], false, 'Curl pupitre', 'Banc pupitre + haltères', null, null, 'Garder les biceps sous tension.'),
  ('0f0798d0-1066-4f3f-9119-41db0938bcb3', '9bf4f72b-9512-4c77-a408-8e142c784a46', '136e5f62-088e-48c8-abdf-ff3922c01910', 6, 4, ARRAY['12','12','11','10'], ARRAY['25','28','32','35'], '90', ARRAY['7','8','8','8'], false, 'Extension poulie haute', 'Poulie haute', null, null, 'Contrôler le retour de la charge.'),
  ('7f526fdf-1ab3-4a2f-a341-25f146419e55', '0238811d-e5a5-4878-84ba-08bab6d9b796', '136e5f62-088e-48c8-abdf-ff3922c01910', 1, 4, ARRAY['12','11','10','10'], ARRAY['40','45','50','55'], '120', ARRAY['7','8','8','9'], false, 'Développé couché', 'Barre + rack', null, null, 'Pieds vissés dans le sol.'),
  ('0d76460b-846a-47b1-9b5e-a5cb42a79207', '0238811d-e5a5-4878-84ba-08bab6d9b796', '136e5f62-088e-48c8-abdf-ff3922c01910', 2, 4, ARRAY['12','12','11','10'], ARRAY['15','17','18','20'], '90', ARRAY['7','7','8','8'], false, 'Développé incliné', 'Haltères', null, null, 'Inclinaison à 30 degrés.'),
  ('ce1ad3b9-d837-4da2-b3b0-f82d88f26ad7', '0238811d-e5a5-4878-84ba-08bab6d9b796', '136e5f62-088e-48c8-abdf-ff3922c01910', 3, 4, ARRAY['12','12','11','10'], ARRAY['15','17','18','20'], '90', ARRAY['7','7','8','8'], false, 'Développé décliné', 'Haltères', null, null, 'Guidage serré pour les triceps.'),
  ('7d1fef0f-c913-4636-8174-c2d9a21f2b99', '0238811d-e5a5-4878-84ba-08bab6d9b796', '136e5f62-088e-48c8-abdf-ff3922c01910', 4, 4, ARRAY['15','15','14','12'], ARRAY['10','12','13','15'], '75', ARRAY['7','8','8','9'], false, 'Écartés couchés', 'Haltères', null, null, 'Ouverture contrôlée des bras.'),
  ('b56237ab-7f35-4f16-aee7-b4e8df3884a9', '0238811d-e5a5-4878-84ba-08bab6d9b796', '136e5f62-088e-48c8-abdf-ff3922c01910', 5, 4, ARRAY['10','10','9','8'], ARRAY['20','22','23','25'], '90', ARRAY['7','7','8','8'], false, 'Pull over é', 'Haltère', null, null, 'Accent sur l''étirement du grand dorsal.');

-- Sessions d'entraînement réelles pour alimenter les graphiques

with session_source as (
  select
    gen_random_uuid() as session_id,
    '136e5f62-088e-48c8-abdf-ff3922c01910'::uuid as user_id,
    '18151b49-20c6-4220-bd33-4b6643202372'::uuid as program_id,
    '9bf4f72b-9512-4c77-a408-8e142c784a46'::uuid as training_id,
    gs as session_index,
    ('2024-10-07T18:30:00Z'::timestamptz + (gs - 1) * interval '7 days') as performed_at
  from generate_series(1, 15) as gs
  union all
  select
    gen_random_uuid() as session_id,
    '136e5f62-088e-48c8-abdf-ff3922c01910'::uuid as user_id,
    '18151b49-20c6-4220-bd33-4b6643202372'::uuid as program_id,
    '0238811d-e5a5-4878-84ba-08bab6d9b796'::uuid as training_id,
    gs as session_index,
    ('2024-10-10T17:45:00Z'::timestamptz + (gs - 1) * interval '7 days') as performed_at
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
    ('52fef4d1-c665-469c-b78c-1f484f83837a'::uuid, '9bf4f72b-9512-4c77-a408-8e142c784a46'::uuid, 4, 11, 1, 20::numeric, 0::numeric, 2.5::numeric),
    ('ef89d65d-bba9-4d2b-a6c7-1a53954483a8'::uuid, '9bf4f72b-9512-4c77-a408-8e142c784a46'::uuid, 4, 11, 1, 10::numeric, 0::numeric, 1.5::numeric),
    ('ee10006e-06a7-4e44-b00b-740d32497fe8'::uuid, '9bf4f72b-9512-4c77-a408-8e142c784a46'::uuid, 4, 11, 1, 15::numeric, 0::numeric, 1.5::numeric),
    ('a29be77d-85bf-47c1-bf28-8257f6eafd88'::uuid, '9bf4f72b-9512-4c77-a408-8e142c784a46'::uuid, 4, 13, 2, 0::numeric, 0::numeric, 0::numeric),
    ('dbd2dc1d-7c76-4641-9c6f-2bd6a64f4700'::uuid, '9bf4f72b-9512-4c77-a408-8e142c784a46'::uuid, 4, 9, 1, 15::numeric, 0::numeric, 1.5::numeric),
    ('0f0798d0-1066-4f3f-9119-41db0938bcb3'::uuid, '9bf4f72b-9512-4c77-a408-8e142c784a46'::uuid, 4, 11, 1, 25::numeric, 0::numeric, 3.3::numeric),
    ('7f526fdf-1ab3-4a2f-a341-25f146419e55'::uuid, '0238811d-e5a5-4878-84ba-08bab6d9b796'::uuid, 4, 11, 1, 40::numeric, 0::numeric, 5::numeric),
    ('0d76460b-846a-47b1-9b5e-a5cb42a79207'::uuid, '0238811d-e5a5-4878-84ba-08bab6d9b796'::uuid, 4, 11, 1, 15::numeric, 0::numeric, 1.7::numeric),
    ('ce1ad3b9-d837-4da2-b3b0-f82d88f26ad7'::uuid, '0238811d-e5a5-4878-84ba-08bab6d9b796'::uuid, 4, 11, 1, 15::numeric, 0::numeric, 1.7::numeric),
    ('7d1fef0f-c913-4636-8174-c2d9a21f2b99'::uuid, '0238811d-e5a5-4878-84ba-08bab6d9b796'::uuid, 4, 13, 2, 10::numeric, 0::numeric, 1.7::numeric),
    ('b56237ab-7f35-4f16-aee7-b4e8df3884a9'::uuid, '0238811d-e5a5-4878-84ba-08bab6d9b796'::uuid, 4, 9, 1, 20::numeric, 0::numeric, 1.7::numeric)
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
  '18151b49-20c6-4220-bd33-4b6643202372',
  '9bf4f72b-9512-4c77-a408-8e142c784a46',
  '52fef4d1-c665-469c-b78c-1f484f83837a',
  '{"selectedExerciseId":"52fef4d1-c665-469c-b78c-1f484f83837a","exercises":{"52fef4d1-c665-469c-b78c-1f484f83837a":{"sessionCount":"15","curveType":"poids-maximum"},"7f526fdf-1ab3-4a2f-a341-25f146419e55":{"sessionCount":"15","curveType":"poids-total"}}}'::jsonb,
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
