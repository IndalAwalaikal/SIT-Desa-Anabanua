FROM golang:1.26.6-alpine AS migrate-build
RUN CGO_ENABLED=0 go install -tags 'mysql' github.com/golang-migrate/migrate/v4/cmd/migrate@v4.18.3

FROM golang:1.26.6-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags='-s -w' -o /api ./cmd/api
FROM alpine:3.20
RUN adduser -D -H appuser && mkdir -p /app/uploads && chown appuser:appuser /app/uploads
WORKDIR /app
COPY --from=build /api /app/api
COPY --from=migrate-build /go/bin/migrate /usr/local/bin/migrate
COPY migrations /app/migrations
COPY entrypoint.sh /app/entrypoint.sh
USER appuser
EXPOSE 8080
ENTRYPOINT ["/app/entrypoint.sh"]
