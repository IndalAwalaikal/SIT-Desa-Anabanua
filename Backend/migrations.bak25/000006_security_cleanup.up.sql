-- Disable the fixed demonstration identities from migrations before 000006.
-- Operators must bootstrap a new, unique super-admin account via environment.
UPDATE users
SET is_active = FALSE
WHERE id IN ('usr-maria', 'usr-admin', 'usr-super');
