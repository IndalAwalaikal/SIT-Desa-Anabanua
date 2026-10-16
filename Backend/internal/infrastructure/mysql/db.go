package mysql

import (
	"context"
	"database/sql"
	"desa-anabanua-api/internal/infrastructure/config"
	"fmt"
	"github.com/go-sql-driver/mysql"
	"time"
)

func Open(c config.Config) (*sql.DB, error) {
	cfg := mysql.Config{User: c.DBUser, Passwd: c.DBPassword, Net: "tcp", Addr: fmt.Sprintf("%s:%s", c.DBHost, c.DBPort), DBName: c.DBName, ParseTime: true, Loc: time.Local, AllowNativePasswords: true}
	db, e := sql.Open("mysql", cfg.FormatDSN())
	if e != nil {
		return nil, e
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if e = db.PingContext(ctx); e != nil {
		db.Close()
		return nil, e
	}
	return db, nil
}
