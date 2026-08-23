-- Migration 000008: Email verification via OTP (Brevo) + surat notification email.
-- Adds email_verified flag, otp_codes table, email_log table, and surat delivery
-- tracking columns. Existing users (including bootstrap super admin) are marked
-- as email-verified so they keep working.

-- 1. Users: track email verification status.
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE users SET email_verified = TRUE;

-- 2. One-time passcode (OTP) table for verify_email & reset_password.
-- A single user has at most one *pending* code per purpose; older rows for the
-- same (user_id, purpose) are invalidated by purpose-scoped lookup + usage.
CREATE TABLE IF NOT EXISTS otp_codes (
  id           CHAR(26)      NOT NULL PRIMARY KEY,
  user_id      CHAR(26)      NOT NULL,
  code         VARCHAR(10)   NOT NULL,
  purpose      ENUM('verify_email','reset_password') NOT NULL,
  expires_at   DATETIME      NOT NULL,
  used_at      DATETIME      NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_otp_user  (user_id),
  INDEX idx_otp_code  (code)
);

-- 3. Surat delivery: track whether a finished letter's email was sent.
ALTER TABLE pengajuan_surat ADD COLUMN dokumen_email_terkirim       BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE pengajuan_surat ADD COLUMN dokumen_email_terkirim_at    DATETIME NULL;

-- 4. Email send log (audit trail for verify/reset/surat).
CREATE TABLE IF NOT EXISTS email_log (
  id            CHAR(26)      NOT NULL PRIMARY KEY,
  user_id       CHAR(26)      NOT NULL,
  purpose       ENUM('verify_email','reset_password','surat_selesai') NOT NULL,
  to_email      VARCHAR(255)  NOT NULL,
  subject       VARCHAR(255)  NOT NULL,
  status        ENUM('sent','failed') NOT NULL DEFAULT 'sent',
  error_message TEXT          NULL,
  sent_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email_user (user_id)
);
