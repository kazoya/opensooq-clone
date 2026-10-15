-- 002: helpful lookups
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users ((lower(data->>'email')));
CREATE INDEX IF NOT EXISTS ads_city_idx ON ads ((data->>'cityId'));
CREATE INDEX IF NOT EXISTS ads_category_idx ON ads ((data->>'categoryId'));
