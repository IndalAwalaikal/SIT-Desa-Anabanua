package storage

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/oklog/ulid/v2"
)

// LocalStorage keeps user uploads below a single configured root. Filenames are
// generated server-side, so client supplied paths can never escape the root.
type LocalStorage struct{ root, publicPrefix string }

func NewLocal(root, publicPrefix string) (*LocalStorage, error) {
	if err := os.MkdirAll(root, 0o750); err != nil {
		return nil, fmt.Errorf("create storage root: %w", err)
	}
	return &LocalStorage{root: filepath.Clean(root), publicPrefix: strings.TrimRight(publicPrefix, "/")}, nil
}

func (s *LocalStorage) Save(ctx context.Context, folder string, file io.Reader, filename string) (string, error) {
	if err := ctx.Err(); err != nil {
		return "", err
	}
	folder = filepath.Base(folder)
	ext := strings.ToLower(filepath.Ext(filepath.Base(filename)))
	name := ulid.Make().String() + ext
	dir := filepath.Join(s.root, folder)
	if err := os.MkdirAll(dir, 0o750); err != nil {
		return "", err
	}
	path := filepath.Join(dir, name)
	out, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o640)
	if err != nil {
		return "", err
	}
	defer out.Close()
	if _, err := io.Copy(out, file); err != nil {
		_ = os.Remove(path)
		return "", err
	}
	return s.publicPrefix + "/" + folder + "/" + name, nil
}

func (s *LocalStorage) Open(ctx context.Context, url string) (io.ReadCloser, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	path, err := s.pathFromURL(url)
	if err != nil {
		return nil, err
	}
	return os.Open(path)
}

func (s *LocalStorage) Delete(ctx context.Context, url string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	path, err := s.pathFromURL(url)
	if err != nil {
		return err
	}
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

func (s *LocalStorage) pathFromURL(url string) (string, error) {
	if !strings.HasPrefix(url, s.publicPrefix+"/") {
		return "", fmt.Errorf("storage URL is outside configured prefix")
	}
	rel := strings.TrimPrefix(url, s.publicPrefix+"/")
	path := filepath.Join(s.root, filepath.Clean(rel))
	if path == s.root || !strings.HasPrefix(path, s.root+string(os.PathSeparator)) {
		return "", fmt.Errorf("invalid storage path")
	}
	return path, nil
}
