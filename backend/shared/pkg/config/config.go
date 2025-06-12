package config

import (
	"os"
	"strconv"
)

// Config holds all configuration for the application
type Config struct {
	Server   ServerConfig   `json:"server"`
	Database DatabaseConfig `json:"database"`
	Redis    RedisConfig    `json:"redis"`
}

// ServerConfig holds server configuration
type ServerConfig struct {
	Port string `json:"port"`
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Host     string `json:"host"`
	Port     string `json:"port"`
	Username string `json:"username"`
	Password string `json:"password"`
	Name     string `json:"name"`
	SSLMode  string `json:"ssl_mode"`
}

// RedisConfig holds Redis configuration
type RedisConfig struct {
	Host     string `json:"host"`
	Port     string `json:"port"`
	Password string `json:"password"`
	DB       int    `json:"db"`
}

// Load creates a new configuration from environment variables with defaults
func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Port: getEnv("SERVER_PORT", "8080"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			Username: getEnv("DB_USERNAME", "postgres"),
			Password: getEnv("DB_PASSWORD", "postgres123"),
			Name:     getEnv("DB_NAME", "restaurant_platform"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
		},
	}
}

// getEnv gets an environment variable with a fallback value
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

// getEnvAsInt gets an environment variable as integer with a fallback value
func getEnvAsInt(name string, fallback int) int {
	valueStr := getEnv(name, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return fallback
}

// GetDSN returns the database connection string
func (d *DatabaseConfig) GetDSN() string {
	return "host=" + d.Host + " port=" + d.Port + " user=" + d.Username + 
		   " password=" + d.Password + " dbname=" + d.Name + " sslmode=" + d.SSLMode
}