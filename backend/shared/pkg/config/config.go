package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

// Config holds all configuration for the application
type Config struct {
	Server   ServerConfig   `mapstructure:"server" json:"server"`
	Database DatabaseConfig `mapstructure:"database" json:"database"`
	Redis    RedisConfig    `mapstructure:"redis" json:"redis"`
	JWT      JWTConfig      `mapstructure:"jwt" json:"jwt"`
}

// ServerConfig holds server configuration
type ServerConfig struct {
	Port string `mapstructure:"port" json:"port"`
	Host string `mapstructure:"host" json:"host"`
	Mode string `mapstructure:"mode" json:"mode"`
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Host     string `mapstructure:"host" json:"host"`
	Port     string `mapstructure:"port" json:"port"`
	Username string `mapstructure:"username" json:"username"`
	Password string `mapstructure:"password" json:"password"`
	Name     string `mapstructure:"name" json:"name"`
	SSLMode  string `mapstructure:"ssl_mode" json:"ssl_mode"`
	MaxOpenConns int `mapstructure:"max_open_conns" json:"max_open_conns"`
	MaxIdleConns int `mapstructure:"max_idle_conns" json:"max_idle_conns"`
}

// RedisConfig holds Redis configuration
type RedisConfig struct {
	Host     string `mapstructure:"host" json:"host"`
	Port     string `mapstructure:"port" json:"port"`
	Password string `mapstructure:"password" json:"password"`
	DB       int    `mapstructure:"db" json:"db"`
	PoolSize int    `mapstructure:"pool_size" json:"pool_size"`
}

// JWTConfig holds JWT configuration
type JWTConfig struct {
	SecretKey               string `mapstructure:"secret_key" json:"secret_key"`
	ExpirationMinutes       int    `mapstructure:"expiration_minutes" json:"expiration_minutes"`
	RefreshExpirationHours  int    `mapstructure:"refresh_expiration_hours" json:"refresh_expiration_hours"`
}

// Load creates a new configuration using Viper
func Load() (*Config, error) {
	v := viper.New()

	// Set config file properties
	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath(".")
	v.AddConfigPath("./config")
	v.AddConfigPath("../config")
	v.AddConfigPath("../../config")
	v.AddConfigPath("/etc/restaurant-platform/")

	// Set environment variable properties
	v.SetEnvPrefix("RESTAURANT")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	// Set defaults
	setDefaults(v)

	// Try to read config file
	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
		// Config file not found; relying on defaults and env vars
	}

	var config Config
	if err := v.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("error unmarshaling config: %w", err)
	}

	return &config, nil
}

// LoadWithPath loads configuration from a specific path
func LoadWithPath(configPath string) (*Config, error) {
	v := viper.New()

	// Set config file properties
	v.SetConfigFile(configPath)

	// Set environment variable properties
	v.SetEnvPrefix("RESTAURANT")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	// Set defaults
	setDefaults(v)

	// Read config file
	if err := v.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("error reading config file %s: %w", configPath, err)
	}

	var config Config
	if err := v.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("error unmarshaling config: %w", err)
	}

	return &config, nil
}

// setDefaults sets default values for configuration
func setDefaults(v *viper.Viper) {
	// Server defaults
	v.SetDefault("server.host", "0.0.0.0")
	v.SetDefault("server.port", "8080")
	v.SetDefault("server.mode", "release")

	// Database defaults
	v.SetDefault("database.host", "localhost")
	v.SetDefault("database.port", "5432")
	v.SetDefault("database.username", "postgres")
	v.SetDefault("database.password", "postgres123")
	v.SetDefault("database.name", "restaurant_platform")
	v.SetDefault("database.ssl_mode", "disable")
	v.SetDefault("database.max_open_conns", 25)
	v.SetDefault("database.max_idle_conns", 5)

	// Redis defaults
	v.SetDefault("redis.host", "localhost")
	v.SetDefault("redis.port", "6379")
	v.SetDefault("redis.password", "")
	v.SetDefault("redis.db", 0)
	v.SetDefault("redis.pool_size", 10)

	// JWT defaults
	v.SetDefault("jwt.secret_key", "restaurant-platform-secret-key-change-in-production")
	v.SetDefault("jwt.expiration_minutes", 60)
	v.SetDefault("jwt.refresh_expiration_hours", 168)
}

// GetConfigPath returns the path to the config file being used
func GetConfigPath() string {
	v := viper.New()
	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath(".")
	v.AddConfigPath("./config")
	v.AddConfigPath("../config")
	v.AddConfigPath("../../config")
	v.AddConfigPath("/etc/restaurant-platform/")

	if err := v.ReadInConfig(); err == nil {
		return v.ConfigFileUsed()
	}
	return "config file not found"
}

// ValidateConfig validates the configuration
func (c *Config) Validate() error {
	if c.Server.Port == "" {
		return fmt.Errorf("server port is required")
	}
	if c.Database.Host == "" {
		return fmt.Errorf("database host is required")
	}
	if c.Database.Name == "" {
		return fmt.Errorf("database name is required")
	}
	if c.JWT.SecretKey == "" {
		return fmt.Errorf("JWT secret key is required")
	}
	return nil
}

// GetDSN returns the database connection string
func (d *DatabaseConfig) GetDSN() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		d.Host, d.Port, d.Username, d.Password, d.Name, d.SSLMode)
}

// GetRedisAddr returns the Redis address
func (r *RedisConfig) GetRedisAddr() string {
	return fmt.Sprintf("%s:%s", r.Host, r.Port)
}

// GetServerAddr returns the server address
func (s *ServerConfig) GetServerAddr() string {
	return fmt.Sprintf("%s:%s", s.Host, s.Port)
}