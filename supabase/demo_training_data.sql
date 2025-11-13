-- Script d'exemple pour injecter un programme "Prise de masse" complet.
-- ⚠️ Remplacez target_user par l'identifiant de l'utilisateur cible
-- avant d'exécuter le bloc DO.
DO $$
DECLARE
  target_user uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Nettoyage préalable
  DELETE FROM training_session_sets
  WHERE session_exercise_id IN (
    SELECT tse.id
    FROM training_session_exercises tse
    JOIN training_sessions ts ON ts.id = tse.session_id
    WHERE ts.user_id = target_user
  );

  DELETE FROM training_session_exercises
  WHERE session_id IN (SELECT id FROM training_sessions WHERE user_id = target_user);

  DELETE FROM training_sessions WHERE user_id = target_user;
  DELETE FROM training_rows WHERE user_id = target_user;
  DELETE FROM trainings WHERE user_id = target_user;
  DELETE FROM programs WHERE user_id = target_user;

  -- Programme principal
  INSERT INTO programs (id, user_id, name, position, dashboard, created_at, is_new)
  VALUES (
    '76dc1f51-aebb-44d0-a648-d32cc4cc40e3',
    target_user,
    'Prise de masse',
    1,
    true,
    timezone('utc', now()),
    false
  );

  -- Entraînements
  INSERT INTO trainings (id, name, user_id, program_id, position, app, dashboard)
  VALUES
    ('bff7fefb-b14b-4fd8-8454-fc1f8bcd7bde', 'Biceps & Triceps', target_user, '76dc1f51-aebb-44d0-a648-d32cc4cc40e3', 1, true, true),
    ('38825d75-3ce6-4f8e-96f1-ea5eb263e365', 'Pectoraux', target_user, '76dc1f51-aebb-44d0-a648-d32cc4cc40e3', 2, true, true);

  -- Exercices
  INSERT INTO training_rows (
    id, training_id, user_id, "order", series, repetitions, poids, repos, effort,
    checked, exercice, materiel, superset_id, link, note, position
  )
  VALUES
    ('05e07eea-7fb7-47bd-9db4-9055ee2b71ac', 'bff7fefb-b14b-4fd8-8454-fc1f8bcd7bde', target_user, 1, 4,
      ARRAY['10-12','10-12','10-12','10-12']::text[], ARRAY['20-22','22-24','24-26','26-28']::text[], '90s',
      ARRAY['parfait','parfait','parfait','parfait']::text[], false, 'Curl debout', 'Barre EZ', NULL, NULL,
      'Cycle lourd entre 20 et 28 kg', 1),
    ('a005a29d-c40b-4097-b543-7fae0b478279', 'bff7fefb-b14b-4fd8-8454-fc1f8bcd7bde', target_user, 2, 4,
      ARRAY['10-12','10-12','10-12','10-12']::text[], ARRAY['10-11','11-12','12-13','13-15']::text[], '75s',
      ARRAY['parfait','parfait','parfait','parfait']::text[], false, 'Kick back', 'Haltères', NULL, NULL,
      'Isolation triceps coude fixe', 2),
    ('a1bb6f3b-d5b0-427f-8cba-a74f042db9ec', 'bff7fefb-b14b-4fd8-8454-fc1f8bcd7bde', target_user, 3, 4,
      ARRAY['10-12','10-12','10-12','10-12']::text[], ARRAY['15-16','16-17','17-19','18-20']::text[], '90s',
      ARRAY['parfait','parfait','parfait','parfait']::text[], false, 'Curl alterné assis', 'Haltères', NULL, NULL,
      'Accent contrôle et tempo', 3),
    ('d5b69311-bc9c-45d7-afb6-dbb47f96b16c', 'bff7fefb-b14b-4fd8-8454-fc1f8bcd7bde', target_user, 4, 4,
      ARRAY['12-15','12-15','12-15','12-15']::text[], ARRAY['0','0','0','0']::text[], '60s',
      ARRAY['parfait','parfait','parfait','parfait']::text[], false, 'Dips', 'Poids du corps', NULL, NULL,
      'Amplitude complète', 4),
    ('e5e7a690-029b-4189-9443-33167aba27d8', 'bff7fefb-b14b-4fd8-8454-fc1f8bcd7bde', target_user, 5, 4,
      ARRAY['8-10','8-10','8-10','8-10']::text[], ARRAY['15-16','16-17','17-18','18-20']::text[], '90s',
      ARRAY['parfait','parfait','parfait','parfait']::text[], false, 'Curl pupitre', 'Banc Larry Scott', NULL, NULL,
      'Travail lourd contrôlé', 5),
    ('751b1696-90cd-4c26-9d60-ae33986f4b4f', 'bff7fefb-b14b-4fd8-8454-fc1f8bcd7bde', target_user, 6, 4,
      ARRAY['10-12','10-12','10-12','10-12']::text[], ARRAY['25-27','27-30','30-32','32-35']::text[], '75s',
      ARRAY['parfait','parfait','parfait','parfait']::text[], false, 'Extension poulie haute', 'Poulie corde', NULL, NULL,
      'Finisher triceps', 6),
    ('1f84fe96-2391-45d2-8970-8576067625a5', '38825d75-3ce6-4f8e-96f1-ea5eb263e365', target_user, 1, 4,
      ARRAY['10-12','10-12','10-12','10-12']::text[], ARRAY['40-44','44-48','48-52','52-55']::text[], '120s',
      ARRAY['parfait','parfait','parfait','parfait']::text[], false, 'Développé couché', 'Barre olympique', NULL, NULL,
      'Progression linéaire', 1),
    ('085eac38-c4f8-4056-9272-0466f80199f9', '38825d75-3ce6-4f8e-96f1-ea5eb263e365', target_user, 2, 4,
      ARRAY['10-12','10-12','10-12','10-12']::text[], ARRAY['15-16','16-18','18-19','19-20']::text[], '90s',
      ARRAY['parfait','parfait','parfait','parfait']::text[], false, 'Développé incliné', 'Haltères', NULL, NULL,
      'Faisceau supérieur', 2),
    ('54f65963-1af1-422f-b2ca-6279e62f4170', '38825d75-3ce6-4f8e-96f1-ea5eb263e365', target_user, 3, 4,
      ARRAY['10-12','10-12','10-12','10-12']::text[], ARRAY['15-16','16-17','17-19','19-20']::text[], '90s',
      ARRAY['parfait','parfait','parfait','parfait']::text[], false, 'Développé décliné', 'Barre guidée', NULL, NULL,
      'Bas de pectoraux', 3),
    ('5879735e-b67d-4a5a-a6e2-f2c4436a2094', '38825d75-3ce6-4f8e-96f1-ea5eb263e365', target_user, 4, 4,
      ARRAY['12-15','12-15','12-15','12-15']::text[], ARRAY['10-11','11-12','12-13','13-15']::text[], '75s',
      ARRAY['parfait','parfait','parfait','parfait']::text[], false, 'Écartés couchés', 'Haltères légers', NULL, NULL,
      'Étirement contrôlé', 4),
    ('affcfd3b-6618-4bdf-ba72-3ae75656a65e', '38825d75-3ce6-4f8e-96f1-ea5eb263e365', target_user, 5, 4,
      ARRAY['8-10','8-10','8-10','8-10']::text[], ARRAY['20-21','21-22','22-24','24-25']::text[], '90s',
      ARRAY['parfait','parfait','parfait','parfait']::text[], false, 'Pull over', 'Haltère lourd', NULL, NULL,
      'Ouverture cage thoracique', 5);

  -- Séances hebdomadaires
  INSERT INTO training_sessions (id, user_id, program_id, training_id, performed_at, created_at, updated_at)
  VALUES
    ('9568d91c-e650-4b1f-9ee2-fe01705773ee', target_user, '76dc1f51-aebb-44d0-a648-d32cc4cc40e3', 'bff7fefb-b14b-4fd8-8454-fc1f8bcd7bde', '2024-04-01T18:00:00+00', '2024-04-01T18:00:00+00', '2024-04-01T18:00:00+00'),
    ('3a9ccac9-da38-42d1-913a-7ee9cab4f407', target_user, '76dc1f51-aebb-44d0-a648-d32cc4cc40e3', 'bff7fefb-b14b-4fd8-8454-fc1f8bcd7bde', '2024-04-08T18:00:00+00', '2024-04-08T18:00:00+00', '2024-04-08T18:00:00+00'),
    ('1ca71ab3-6136-4885-a79b-4bbf04626e6a', target_user, '76dc1f51-aebb-44d0-a648-d32cc4cc40e3', 'bff7fefb-b14b-4fd8-8454-fc1f8bcd7bde', '2024-04-15T18:00:00+00', '2024-04-15T18:00:00+00', '2024-04-15T18:00:00+00'),
    ('c533102e-52ee-4b56-b5e4-efe164fa4a09', target_user, '76dc1f51-aebb-44d0-a648-d32cc4cc40e3', 'bff7fefb-b14b-4fd8-8454-fc1f8bcd7bde', '2024-04-22T18:00:00+00', '2024-04-22T18:00:00+00', '2024-04-22T18:00:00+00'),
    ('a81a499a-85f2-4489-9eec-71e068449e45', target_user, '76dc1f51-aebb-44d0-a648-d32cc4cc40e3', '38825d75-3ce6-4f8e-96f1-ea5eb263e365', '2024-04-03T18:00:00+00', '2024-04-03T18:00:00+00', '2024-04-03T18:00:00+00'),
    ('0f6067ad-c083-4d43-a37d-ce5ec05e7c4f', target_user, '76dc1f51-aebb-44d0-a648-d32cc4cc40e3', '38825d75-3ce6-4f8e-96f1-ea5eb263e365', '2024-04-10T18:00:00+00', '2024-04-10T18:00:00+00', '2024-04-10T18:00:00+00'),
    ('3c1c3030-ae48-40af-b23a-082cfdcd561d', target_user, '76dc1f51-aebb-44d0-a648-d32cc4cc40e3', '38825d75-3ce6-4f8e-96f1-ea5eb263e365', '2024-04-17T18:00:00+00', '2024-04-17T18:00:00+00', '2024-04-17T18:00:00+00'),
    ('5ece91d9-ad8b-4eba-b8db-e89c1ead454f', target_user, '76dc1f51-aebb-44d0-a648-d32cc4cc40e3', '38825d75-3ce6-4f8e-96f1-ea5eb263e365', '2024-04-24T18:00:00+00', '2024-04-24T18:00:00+00', '2024-04-24T18:00:00+00');

  -- Exercices associés aux séances
  INSERT INTO training_session_exercises (id, session_id, training_row_id, exercise_name, position, created_at, updated_at)
  VALUES
    ('3598bd89-9d07-405e-9dc3-ab2c67521eba','9568d91c-e650-4b1f-9ee2-fe01705773ee','05e07eea-7fb7-47bd-9db4-9055ee2b71ac','Curl debout',1,'2024-04-01T18:00:00+00','2024-04-01T18:00:00+00'),
    ('407d5a95-c719-42c3-8ccb-872278bb90a4','9568d91c-e650-4b1f-9ee2-fe01705773ee','a005a29d-c40b-4097-b543-7fae0b478279','Kick back',2,'2024-04-01T18:00:00+00','2024-04-01T18:00:00+00'),
    ('0bd32798-b559-431e-96a1-1acae7073cd5','9568d91c-e650-4b1f-9ee2-fe01705773ee','a1bb6f3b-d5b0-427f-8cba-a74f042db9ec','Curl alterné assis',3,'2024-04-01T18:00:00+00','2024-04-01T18:00:00+00'),
    ('5b1d281c-a616-4278-8fbd-5cfad848186a','9568d91c-e650-4b1f-9ee2-fe01705773ee','d5b69311-bc9c-45d7-afb6-dbb47f96b16c','Dips',4,'2024-04-01T18:00:00+00','2024-04-01T18:00:00+00'),
    ('3b4f3ec9-8d61-46ec-ab94-a454f08e7a9e','9568d91c-e650-4b1f-9ee2-fe01705773ee','e5e7a690-029b-4189-9443-33167aba27d8','Curl pupitre',5,'2024-04-01T18:00:00+00','2024-04-01T18:00:00+00'),
    ('8ed4a886-f9fb-482e-9364-6147700e552f','9568d91c-e650-4b1f-9ee2-fe01705773ee','751b1696-90cd-4c26-9d60-ae33986f4b4f','Extension poulie haute',6,'2024-04-01T18:00:00+00','2024-04-01T18:00:00+00'),
    ('99b58883-f590-4e49-8db5-7120467b8639','3a9ccac9-da38-42d1-913a-7ee9cab4f407','05e07eea-7fb7-47bd-9db4-9055ee2b71ac','Curl debout',1,'2024-04-08T18:00:00+00','2024-04-08T18:00:00+00'),
    ('33ddd35d-2b8a-4e8a-a72b-ca06d0273458','3a9ccac9-da38-42d1-913a-7ee9cab4f407','a005a29d-c40b-4097-b543-7fae0b478279','Kick back',2,'2024-04-08T18:00:00+00','2024-04-08T18:00:00+00'),
    ('a3de7f30-db84-4b6b-a310-87d0c687b74e','3a9ccac9-da38-42d1-913a-7ee9cab4f407','a1bb6f3b-d5b0-427f-8cba-a74f042db9ec','Curl alterné assis',3,'2024-04-08T18:00:00+00','2024-04-08T18:00:00+00'),
    ('e18e1cb7-f4c2-41d9-9151-4efecda204b2','3a9ccac9-da38-42d1-913a-7ee9cab4f407','d5b69311-bc9c-45d7-afb6-dbb47f96b16c','Dips',4,'2024-04-08T18:00:00+00','2024-04-08T18:00:00+00'),
    ('e2e66e8f-5f84-4c03-b10e-c89bec8290c7','3a9ccac9-da38-42d1-913a-7ee9cab4f407','e5e7a690-029b-4189-9443-33167aba27d8','Curl pupitre',5,'2024-04-08T18:00:00+00','2024-04-08T18:00:00+00'),
    ('39f0b377-9cca-4f26-a0e0-edc14b8ddfe5','3a9ccac9-da38-42d1-913a-7ee9cab4f407','751b1696-90cd-4c26-9d60-ae33986f4b4f','Extension poulie haute',6,'2024-04-08T18:00:00+00','2024-04-08T18:00:00+00'),
    ('e8bef810-044c-44cf-ac5c-a55873c29966','1ca71ab3-6136-4885-a79b-4bbf04626e6a','05e07eea-7fb7-47bd-9db4-9055ee2b71ac','Curl debout',1,'2024-04-15T18:00:00+00','2024-04-15T18:00:00+00'),
    ('7cbce57f-817d-4280-92ba-8ac9d14abfb8','1ca71ab3-6136-4885-a79b-4bbf04626e6a','a005a29d-c40b-4097-b543-7fae0b478279','Kick back',2,'2024-04-15T18:00:00+00','2024-04-15T18:00:00+00'),
    ('f0916fc2-b12f-4a0e-b840-8cad7070bf7c','1ca71ab3-6136-4885-a79b-4bbf04626e6a','a1bb6f3b-d5b0-427f-8cba-a74f042db9ec','Curl alterné assis',3,'2024-04-15T18:00:00+00','2024-04-15T18:00:00+00'),
    ('bafa71bf-c734-447f-a665-6a06baba2cba','1ca71ab3-6136-4885-a79b-4bbf04626e6a','d5b69311-bc9c-45d7-afb6-dbb47f96b16c','Dips',4,'2024-04-15T18:00:00+00','2024-04-15T18:00:00+00'),
    ('4d02c874-d4d5-4053-a710-f004a5a89792','1ca71ab3-6136-4885-a79b-4bbf04626e6a','e5e7a690-029b-4189-9443-33167aba27d8','Curl pupitre',5,'2024-04-15T18:00:00+00','2024-04-15T18:00:00+00'),
    ('5f5f5744-a053-40b4-987d-017dbd36d7f1','1ca71ab3-6136-4885-a79b-4bbf04626e6a','751b1696-90cd-4c26-9d60-ae33986f4b4f','Extension poulie haute',6,'2024-04-15T18:00:00+00','2024-04-15T18:00:00+00'),
    ('0dbd505d-70bc-482c-81cb-ce45546df7ec','c533102e-52ee-4b56-b5e4-efe164fa4a09','05e07eea-7fb7-47bd-9db4-9055ee2b71ac','Curl debout',1,'2024-04-22T18:00:00+00','2024-04-22T18:00:00+00'),
    ('fd621ee8-5d4f-4136-9755-9579459bbefd','c533102e-52ee-4b56-b5e4-efe164fa4a09','a005a29d-c40b-4097-b543-7fae0b478279','Kick back',2,'2024-04-22T18:00:00+00','2024-04-22T18:00:00+00'),
    ('21573b00-aa78-4f06-af9e-b4c2e5780e6b','c533102e-52ee-4b56-b5e4-efe164fa4a09','a1bb6f3b-d5b0-427f-8cba-a74f042db9ec','Curl alterné assis',3,'2024-04-22T18:00:00+00','2024-04-22T18:00:00+00'),
    ('df4d6a62-9e6b-43df-b64c-5e3b803d266b','c533102e-52ee-4b56-b5e4-efe164fa4a09','d5b69311-bc9c-45d7-afb6-dbb47f96b16c','Dips',4,'2024-04-22T18:00:00+00','2024-04-22T18:00:00+00'),
    ('f67d30b3-7e9d-459e-b616-3059d90d0eed','c533102e-52ee-4b56-b5e4-efe164fa4a09','e5e7a690-029b-4189-9443-33167aba27d8','Curl pupitre',5,'2024-04-22T18:00:00+00','2024-04-22T18:00:00+00'),
    ('4046656c-0011-408b-b2c1-c4fca9f8f3d0','c533102e-52ee-4b56-b5e4-efe164fa4a09','751b1696-90cd-4c26-9d60-ae33986f4b4f','Extension poulie haute',6,'2024-04-22T18:00:00+00','2024-04-22T18:00:00+00'),
    ('6f37018e-b022-46b5-b63a-dfb1d5b81245','a81a499a-85f2-4489-9eec-71e068449e45','1f84fe96-2391-45d2-8970-8576067625a5','Développé couché',1,'2024-04-03T18:00:00+00','2024-04-03T18:00:00+00'),
    ('ccd0b928-1521-4a8f-ae50-cdfe31612436','a81a499a-85f2-4489-9eec-71e068449e45','085eac38-c4f8-4056-9272-0466f80199f9','Développé incliné',2,'2024-04-03T18:00:00+00','2024-04-03T18:00:00+00'),
    ('618529f1-97b2-45d3-b8d3-93795a6df9a5','a81a499a-85f2-4489-9eec-71e068449e45','54f65963-1af1-422f-b2ca-6279e62f4170','Développé décliné',3,'2024-04-03T18:00:00+00','2024-04-03T18:00:00+00'),
    ('c06bf07e-815f-47a0-a1f1-956094893511','a81a499a-85f2-4489-9eec-71e068449e45','5879735e-b67d-4a5a-a6e2-f2c4436a2094','Écartés couchés',4,'2024-04-03T18:00:00+00','2024-04-03T18:00:00+00'),
    ('f44765f2-782c-443e-8c9b-4f6f2a8d7f26','a81a499a-85f2-4489-9eec-71e068449e45','affcfd3b-6618-4bdf-ba72-3ae75656a65e','Pull over',5,'2024-04-03T18:00:00+00','2024-04-03T18:00:00+00'),
    ('fd56326d-6707-4643-9679-88fcfc560fd7','0f6067ad-c083-4d43-a37d-ce5ec05e7c4f','1f84fe96-2391-45d2-8970-8576067625a5','Développé couché',1,'2024-04-10T18:00:00+00','2024-04-10T18:00:00+00'),
    ('5e0c878c-fa53-49ff-b118-9f02fada51b0','0f6067ad-c083-4d43-a37d-ce5ec05e7c4f','085eac38-c4f8-4056-9272-0466f80199f9','Développé incliné',2,'2024-04-10T18:00:00+00','2024-04-10T18:00:00+00'),
    ('cef2716b-38f5-477b-9c60-f5692ebbb51f','0f6067ad-c083-4d43-a37d-ce5ec05e7c4f','54f65963-1af1-422f-b2ca-6279e62f4170','Développé décliné',3,'2024-04-10T18:00:00+00','2024-04-10T18:00:00+00'),
    ('31946ac6-5a5b-47ac-a71e-d18711b104eb','0f6067ad-c083-4d43-a37d-ce5ec05e7c4f','5879735e-b67d-4a5a-a6e2-f2c4436a2094','Écartés couchés',4,'2024-04-10T18:00:00+00','2024-04-10T18:00:00+00'),
    ('f157c3a1-7a9c-46ba-a39f-34535d350dfe','0f6067ad-c083-4d43-a37d-ce5ec05e7c4f','affcfd3b-6618-4bdf-ba72-3ae75656a65e','Pull over',5,'2024-04-10T18:00:00+00','2024-04-10T18:00:00+00'),
    ('1fe7144c-d937-441f-b866-738cd20ff315','3c1c3030-ae48-40af-b23a-082cfdcd561d','1f84fe96-2391-45d2-8970-8576067625a5','Développé couché',1,'2024-04-17T18:00:00+00','2024-04-17T18:00:00+00'),
    ('8e0967ea-0df5-4583-9c9e-20b2694228cc','3c1c3030-ae48-40af-b23a-082cfdcd561d','085eac38-c4f8-4056-9272-0466f80199f9','Développé incliné',2,'2024-04-17T18:00:00+00','2024-04-17T18:00:00+00'),
    ('554d832a-56ab-4e48-9480-c877f937a99f','3c1c3030-ae48-40af-b23a-082cfdcd561d','54f65963-1af1-422f-b2ca-6279e62f4170','Développé décliné',3,'2024-04-17T18:00:00+00','2024-04-17T18:00:00+00'),
    ('8ffa974f-3609-4f49-bc9b-7e40f8995ae3','3c1c3030-ae48-40af-b23a-082cfdcd561d','5879735e-b67d-4a5a-a6e2-f2c4436a2094','Écartés couchés',4,'2024-04-17T18:00:00+00','2024-04-17T18:00:00+00'),
    ('43410f89-5e28-403e-9d69-96129865de5c','3c1c3030-ae48-40af-b23a-082cfdcd561d','affcfd3b-6618-4bdf-ba72-3ae75656a65e','Pull over',5,'2024-04-17T18:00:00+00','2024-04-17T18:00:00+00'),
    ('d54f7110-42a6-4855-909d-e0a10a3659dd','5ece91d9-ad8b-4eba-b8db-e89c1ead454f','1f84fe96-2391-45d2-8970-8576067625a5','Développé couché',1,'2024-04-24T18:00:00+00','2024-04-24T18:00:00+00'),
    ('6ed53a71-aea3-430b-aea0-56602304e954','5ece91d9-ad8b-4eba-b8db-e89c1ead454f','085eac38-c4f8-4056-9272-0466f80199f9','Développé incliné',2,'2024-04-24T18:00:00+00','2024-04-24T18:00:00+00'),
    ('7a2c714a-e41b-42ce-93d3-9683527ca251','5ece91d9-ad8b-4eba-b8db-e89c1ead454f','54f65963-1af1-422f-b2ca-6279e62f4170','Développé décliné',3,'2024-04-24T18:00:00+00','2024-04-24T18:00:00+00'),
    ('d3468dc4-73de-4622-959d-3370efd6a265','5ece91d9-ad8b-4eba-b8db-e89c1ead454f','5879735e-b67d-4a5a-a6e2-f2c4436a2094','Écartés couchés',4,'2024-04-24T18:00:00+00','2024-04-24T18:00:00+00'),
    ('0766981f-73cf-49e2-9649-fa18ec75cedd','5ece91d9-ad8b-4eba-b8db-e89c1ead454f','affcfd3b-6618-4bdf-ba72-3ae75656a65e','Pull over',5,'2024-04-24T18:00:00+00','2024-04-24T18:00:00+00');

  -- Séries détaillées avec variations réelles
  WITH set_data(session_exercise_id, repetitions_arr, weight_arr) AS (
    VALUES
      ('3598bd89-9d07-405e-9dc3-ab2c67521eba'::uuid, ARRAY[12,12,11,10]::int[], ARRAY[22,22,24,24]::numeric[]),
      ('407d5a95-c719-42c3-8ccb-872278bb90a4'::uuid, ARRAY[12,12,11,10]::int[], ARRAY[10,10,12,12]::numeric[]),
      ('0bd32798-b559-431e-96a1-1acae7073cd5'::uuid, ARRAY[12,11,11,10]::int[], ARRAY[16,16,18,18]::numeric[]),
      ('5b1d281c-a616-4278-8fbd-5cfad848186a'::uuid, ARRAY[12,13,13,12]::int[], ARRAY[0,0,0,0]::numeric[]),
      ('3b4f3ec9-8d61-46ec-ab94-a454f08e7a9e'::uuid, ARRAY[10,10,9,8]::int[], ARRAY[15,15,16,16]::numeric[]),
      ('8ed4a886-f9fb-482e-9364-6147700e552f'::uuid, ARRAY[12,11,11,10]::int[], ARRAY[26,26,28,28]::numeric[]),
      ('99b58883-f590-4e49-8db5-7120467b8639'::uuid, ARRAY[12,12,11,10]::int[], ARRAY[24,24,26,26]::numeric[]),
      ('33ddd35d-2b8a-4e8a-a72b-ca06d0273458'::uuid, ARRAY[12,12,11,11]::int[], ARRAY[12,12,13,13]::numeric[]),
      ('a3de7f30-db84-4b6b-a310-87d0c687b74e'::uuid, ARRAY[12,11,11,10]::int[], ARRAY[17,17,19,19]::numeric[]),
      ('e18e1cb7-f4c2-41d9-9151-4efecda204b2'::uuid, ARRAY[13,13,12,12]::int[], ARRAY[0,0,0,0]::numeric[]),
      ('e2e66e8f-5f84-4c03-b10e-c89bec8290c7'::uuid, ARRAY[10,10,9,9]::int[], ARRAY[16,16,17,17]::numeric[]),
      ('39f0b377-9cca-4f26-a0e0-edc14b8ddfe5'::uuid, ARRAY[12,11,10,10]::int[], ARRAY[28,28,30,30]::numeric[]),
      ('e8bef810-044c-44cf-ac5c-a55873c29966'::uuid, ARRAY[11,11,10,9]::int[], ARRAY[26,26,28,28]::numeric[]),
      ('7cbce57f-817d-4280-92ba-8ac9d14abfb8'::uuid, ARRAY[12,11,11,10]::int[], ARRAY[13,13,14,14]::numeric[]),
      ('f0916fc2-b12f-4a0e-b840-8cad7070bf7c'::uuid, ARRAY[11,11,10,10]::int[], ARRAY[18,18,20,20]::numeric[]),
      ('bafa71bf-c734-447f-a665-6a06baba2cba'::uuid, ARRAY[14,14,13,12]::int[], ARRAY[0,0,0,0]::numeric[]),
      ('4d02c874-d4d5-4053-a710-f004a5a89792'::uuid, ARRAY[10,9,9,8]::int[], ARRAY[17,17,18,18]::numeric[]),
      ('5f5f5744-a053-40b4-987d-017dbd36d7f1'::uuid, ARRAY[11,11,10,9]::int[], ARRAY[30,30,32,32]::numeric[]),
      ('0dbd505d-70bc-482c-81cb-ce45546df7ec'::uuid, ARRAY[12,11,11,10]::int[], ARRAY[25,26,27,28]::numeric[]),
      ('fd621ee8-5d4f-4136-9755-9579459bbefd'::uuid, ARRAY[12,12,11,11]::int[], ARRAY[12,13,14,15]::numeric[]),
      ('21573b00-aa78-4f06-af9e-b4c2e5780e6b'::uuid, ARRAY[12,11,11,10]::int[], ARRAY[17,18,19,20]::numeric[]),
      ('df4d6a62-9e6b-43df-b64c-5e3b803d266b'::uuid, ARRAY[15,14,13,12]::int[], ARRAY[0,0,0,0]::numeric[]),
      ('f67d30b3-7e9d-459e-b616-3059d90d0eed'::uuid, ARRAY[10,10,9,9]::int[], ARRAY[16,17,18,19]::numeric[]),
      ('4046656c-0011-408b-b2c1-c4fca9f8f3d0'::uuid, ARRAY[12,11,11,10]::int[], ARRAY[28,30,32,34]::numeric[]),
      ('6f37018e-b022-46b5-b63a-dfb1d5b81245'::uuid, ARRAY[12,12,11,10]::int[], ARRAY[42,45,48,50]::numeric[]),
      ('ccd0b928-1521-4a8f-ae50-cdfe31612436'::uuid, ARRAY[12,11,11,10]::int[], ARRAY[18,18,18,18]::numeric[]),
      ('618529f1-97b2-45d3-b8d3-93795a6df9a5'::uuid, ARRAY[12,12,11,10]::int[], ARRAY[16,16,18,18]::numeric[]),
      ('c06bf07e-815f-47a0-a1f1-956094893511'::uuid, ARRAY[15,14,13,12]::int[], ARRAY[12,12,13,13]::numeric[]),
      ('f44765f2-782c-443e-8c9b-4f6f2a8d7f26'::uuid, ARRAY[10,10,9,9]::int[], ARRAY[20,20,22,22]::numeric[]),
      ('fd56326d-6707-4643-9679-88fcfc560fd7'::uuid, ARRAY[12,12,11,10]::int[], ARRAY[44,47,50,52]::numeric[]),
      ('5e0c878c-fa53-49ff-b118-9f02fada51b0'::uuid, ARRAY[12,11,11,10]::int[], ARRAY[18,19,19,20]::numeric[]),
      ('cef2716b-38f5-477b-9c60-f5692ebbb51f'::uuid, ARRAY[12,11,11,10]::int[], ARRAY[17,17,18,19]::numeric[]),
      ('31946ac6-5a5b-47ac-a71e-d18711b104eb'::uuid, ARRAY[15,14,13,12]::int[], ARRAY[12,13,13,14]::numeric[]),
      ('f157c3a1-7a9c-46ba-a39f-34535d350dfe'::uuid, ARRAY[10,10,9,8]::int[], ARRAY[21,21,23,23]::numeric[]),
      ('1fe7144c-d937-441f-b866-738cd20ff315'::uuid, ARRAY[12,11,11,10]::int[], ARRAY[46,49,52,54]::numeric[]),
      ('8e0967ea-0df5-4583-9c9e-20b2694228cc'::uuid, ARRAY[12,11,10,10]::int[], ARRAY[19,19,20,20]::numeric[]),
      ('554d832a-56ab-4e48-9480-c877f937a99f'::uuid, ARRAY[12,11,11,10]::int[], ARRAY[17,18,19,20]::numeric[]),
      ('8ffa974f-3609-4f49-bc9b-7e40f8995ae3'::uuid, ARRAY[14,14,13,12]::int[], ARRAY[13,13,14,15]::numeric[]),
      ('43410f89-5e28-403e-9d69-96129865de5c'::uuid, ARRAY[10,9,9,8]::int[], ARRAY[22,22,24,24]::numeric[]),
      ('d54f7110-42a6-4855-909d-e0a10a3659dd'::uuid, ARRAY[12,12,11,10]::int[], ARRAY[45,48,51,55]::numeric[]),
      ('6ed53a71-aea3-430b-aea0-56602304e954'::uuid, ARRAY[12,11,11,10]::int[], ARRAY[18,19,20,20]::numeric[]),
      ('7a2c714a-e41b-42ce-93d3-9683527ca251'::uuid, ARRAY[12,11,10,10]::int[], ARRAY[16,17,18,19]::numeric[]),
      ('d3468dc4-73de-4622-959d-3370efd6a265'::uuid, ARRAY[15,14,13,12]::int[], ARRAY[12,13,14,15]::numeric[]),
      ('0766981f-73cf-49e2-9649-fa18ec75cedd'::uuid, ARRAY[10,10,9,8]::int[], ARRAY[21,22,23,25]::numeric[])
  ),
  expanded AS (
    SELECT
      session_exercise_id,
      idx AS set_number,
      repetitions_arr[idx] AS repetitions,
      weight_arr[idx] AS weight
    FROM set_data,
    LATERAL generate_subscripts(repetitions_arr, 1) AS idx
  )
  INSERT INTO training_session_sets (session_exercise_id, set_number, repetitions, weights, created_at, updated_at)
  SELECT
    e.session_exercise_id,
    e.set_number,
    e.repetitions,
    ARRAY[round(e.weight, 2)::text],
    ts.performed_at,
    ts.performed_at
  FROM expanded e
  JOIN training_session_exercises tse ON tse.id = e.session_exercise_id
  JOIN training_sessions ts ON ts.id = tse.session_id;
END $$;
