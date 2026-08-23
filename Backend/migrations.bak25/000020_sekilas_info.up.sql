CREATE TABLE sekilas_info (
    id VARCHAR(50) PRIMARY KEY,
    konten TEXT NOT NULL,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
