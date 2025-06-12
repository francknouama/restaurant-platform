package events

import (
	"context"
	"fmt"
	"log"

	"github.com/go-redis/redis/v8"
)

// EventPublisher interface for publishing domain events
type EventPublisher interface {
	Publish(ctx context.Context, event *DomainEvent) error
	Close() error
}

// RedisStreamPublisher implements EventPublisher using Redis Streams
type RedisStreamPublisher struct {
	client *redis.Client
	stream string
}

// NewRedisStreamPublisher creates a new Redis Streams event publisher
func NewRedisStreamPublisher(redisAddr, password string, db int, streamName string) (*RedisStreamPublisher, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: password,
		DB:       db,
	})

	// Test connection
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &RedisStreamPublisher{
		client: client,
		stream: streamName,
	}, nil
}

// Publish publishes a domain event to Redis Stream
func (p *RedisStreamPublisher) Publish(ctx context.Context, event *DomainEvent) error {
	eventData, err := event.ToJSON()
	if err != nil {
		return fmt.Errorf("failed to serialize event: %w", err)
	}

	// Publish to Redis Stream
	args := &redis.XAddArgs{
		Stream: p.stream,
		Values: map[string]interface{}{
			"event_id":     event.ID,
			"event_type":   string(event.Type),
			"aggregate_id": event.AggregateID,
			"data":         string(eventData),
			"occurred_at":  event.OccurredAt.Unix(),
		},
	}

	result, err := p.client.XAdd(ctx, args).Result()
	if err != nil {
		return fmt.Errorf("failed to publish event to stream %s: %w", p.stream, err)
	}

	log.Printf("Published event %s (ID: %s) to stream %s with message ID: %s", 
		event.Type, event.ID, p.stream, result)
	
	return nil
}

// Close closes the Redis connection
func (p *RedisStreamPublisher) Close() error {
	return p.client.Close()
}