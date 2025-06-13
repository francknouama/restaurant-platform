module github.com/restaurant-platform/user-service

go 1.24.4

replace github.com/restaurant-platform/shared => ../shared

require (
	github.com/golang-jwt/jwt/v5 v5.2.2
	github.com/lib/pq v1.10.9
	github.com/restaurant-platform/shared v0.0.0-00010101000000-000000000000
	golang.org/x/crypto v0.39.0
)
