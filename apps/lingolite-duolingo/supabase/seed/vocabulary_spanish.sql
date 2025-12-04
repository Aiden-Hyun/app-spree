-- Spanish vocabulary seed data
-- Common words organized by difficulty level

-- Get Spanish language ID
WITH spanish_lang AS (
  SELECT id FROM languages WHERE code = 'es' LIMIT 1
)

-- Level 1: Basic greetings and common words
INSERT INTO vocabulary (language_id, word, translation, pronunciation, difficulty_level, is_active)
SELECT 
  (SELECT id FROM spanish_lang),
  word,
  translation,
  pronunciation,
  1,
  true
FROM (VALUES
  ('hola', 'hello', 'OH-lah'),
  ('adiós', 'goodbye', 'ah-dee-OHS'),
  ('por favor', 'please', 'por fah-VOR'),
  ('gracias', 'thank you', 'GRAH-see-ahs'),
  ('sí', 'yes', 'see'),
  ('no', 'no', 'noh'),
  ('agua', 'water', 'AH-gwah'),
  ('comida', 'food', 'koh-MEE-dah'),
  ('casa', 'house', 'KAH-sah'),
  ('amigo', 'friend', 'ah-MEE-goh'),
  ('familia', 'family', 'fah-MEE-lee-ah'),
  ('tiempo', 'time', 'tee-EHM-poh'),
  ('día', 'day', 'DEE-ah'),
  ('noche', 'night', 'NOH-cheh'),
  ('bueno', 'good', 'BWAY-noh'),
  ('malo', 'bad', 'MAH-loh'),
  ('grande', 'big', 'GRAHN-deh'),
  ('pequeño', 'small', 'peh-KEH-nyoh'),
  ('hombre', 'man', 'OHM-breh'),
  ('mujer', 'woman', 'moo-HAIR')
) AS t(word, translation, pronunciation)
ON CONFLICT DO NOTHING;

-- Level 2: Common verbs and phrases
INSERT INTO vocabulary (language_id, word, translation, pronunciation, difficulty_level, is_active)
SELECT 
  (SELECT id FROM spanish_lang),
  word,
  translation,
  pronunciation,
  2,
  true
FROM (VALUES
  ('ser', 'to be', 'sehr'),
  ('estar', 'to be (location/state)', 'ehs-TAHR'),
  ('tener', 'to have', 'teh-NEHR'),
  ('hacer', 'to do/make', 'ah-SEHR'),
  ('poder', 'to be able', 'poh-DEHR'),
  ('decir', 'to say', 'deh-SEER'),
  ('ir', 'to go', 'eer'),
  ('ver', 'to see', 'vehr'),
  ('dar', 'to give', 'dahr'),
  ('saber', 'to know', 'sah-BEHR'),
  ('querer', 'to want', 'keh-REHR'),
  ('llegar', 'to arrive', 'yeh-GAHR'),
  ('pasar', 'to pass/happen', 'pah-SAHR'),
  ('deber', 'must/should', 'deh-BEHR'),
  ('poner', 'to put', 'poh-NEHR'),
  ('parecer', 'to seem', 'pah-reh-SEHR'),
  ('quedar', 'to stay/remain', 'keh-DAHR'),
  ('creer', 'to believe', 'kreh-EHR'),
  ('hablar', 'to speak', 'ah-BLAHR'),
  ('trabajar', 'to work', 'trah-bah-HAHR')
) AS t(word, translation, pronunciation)
ON CONFLICT DO NOTHING;

-- Level 3: Intermediate vocabulary
INSERT INTO vocabulary (language_id, word, translation, pronunciation, difficulty_level, is_active)
SELECT 
  (SELECT id FROM spanish_lang),
  word,
  translation,
  pronunciation,
  3,
  true
FROM (VALUES
  ('conocimiento', 'knowledge', 'koh-noh-see-mee-EHN-toh'),
  ('desarrollo', 'development', 'deh-sah-RROH-yoh'),
  ('experiencia', 'experience', 'ehks-peh-ree-EHN-see-ah'),
  ('importante', 'important', 'eem-por-TAHN-teh'),
  ('necesario', 'necessary', 'neh-seh-SAH-ree-oh'),
  ('diferente', 'different', 'dee-feh-REHN-teh'),
  ('posible', 'possible', 'poh-SEE-bleh'),
  ('siguiente', 'next/following', 'see-gee-EHN-teh'),
  ('anterior', 'previous', 'ahn-teh-ree-OHR'),
  ('principal', 'main/principal', 'preen-see-PAHL'),
  ('gobierno', 'government', 'goh-bee-EHR-noh'),
  ('sociedad', 'society', 'soh-see-eh-DAHD'),
  ('educación', 'education', 'eh-doo-kah-see-OHN'),
  ('salud', 'health', 'sah-LOOD'),
  ('economía', 'economy', 'eh-koh-noh-MEE-ah'),
  ('cultura', 'culture', 'kool-TOO-rah'),
  ('tecnología', 'technology', 'tehk-noh-loh-HEE-ah'),
  ('medio ambiente', 'environment', 'MEH-dee-oh ahm-bee-EHN-teh'),
  ('comunicación', 'communication', 'koh-moo-nee-kah-see-OHN'),
  ('información', 'information', 'een-for-mah-see-OHN')
) AS t(word, translation, pronunciation)
ON CONFLICT DO NOTHING;


