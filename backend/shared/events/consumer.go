package events

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/go-redis/redis/v8"
)

// EventHandler function type for handling domain events
type EventHandler func(ctx context.Context, event *DomainEvent) error

// EventConsumer interface for consuming domain events
type EventConsumer interface {
	Subscribe(ctx context.Context, eventTypes []EventType, handler EventHandler) error
	Start(ctx context.Context) error
	Stop() error
}

// RedisStreamConsumer implements EventConsumer using Redis Streams
type RedisStreamConsumer struct {
	client      *redis.Client
	stream      string
	consumerGroup string
	consumerName  string
	handlers    map[EventType]EventHandler
	running     bool
	stopChan    chan struct{}
}

// NewRedisStreamConsumer creates a new Redis Streams event consumer
func NewRedisStreamConsumer(redisAddr, password string, db int, streamName, consumerGroup, consumerName string) (*RedisStreamConsumer, error) {
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

	consumer := &RedisStreamConsumer{
		client:        client,
		stream:        streamName,
		consumerGroup: consumerGroup,
		consumerName:  consumerName,
		handlers:      make(map[EventType]EventHandler),
		stopChan:      make(chan struct{}),
	}

	// Create consumer group if it doesn't exist
	if err := consumer.createConsumerGroup(ctx); err != nil {
		return nil, err
	}

	return consumer, nil
}

// Subscribe registers an event handler for specific event types
func (c *RedisStreamConsumer) Subscribe(ctx context.Context, eventTypes []EventType, handler EventHandler) error {
	for _, eventType := range eventTypes {
		c.handlers[eventType] = handler
		log.Printf("Subscribed to event type: %s", eventType)
	}
	return nil
}

// Start begins consuming events from the Redis Stream
func (c *RedisStreamConsumer) Start(ctx context.Context) error {
	if c.running {
		return fmt.Errorf("consumer is already running")
	}

	c.running = true
	log.Printf("Starting Redis Stream consumer: %s", c.consumerName)

	go c.consumeLoop(ctx)
	return nil
}

// Stop stops the event consumer
func (c *RedisStreamConsumer) Stop() error {
	if !c.running {
		return nil
	}

	log.Printf("Stopping Redis Stream consumer: %s", c.consumerName)
	c.running = false
	close(c.stopChan)
	return c.client.Close()
}

// createConsumerGroup creates the consumer group if it doesn't exist
func (c *RedisStreamConsumer) createConsumerGroup(ctx context.Context) error {
	// Try to create the consumer group from the beginning of the stream
	// Use MKSTREAM option to create the stream if it doesn't exist
	err := c.client.XGroupCreateMkStream(ctx, c.stream, c.consumerGroup, "0").Err()
	if err != nil && err.Error() != "BUSYGROUP Consumer Group name already exists" {
		return fmt.Errorf("failed to create consumer group %s: %w", c.consumerGroup, err)
	}
	return nil
}

// consumeLoop continuously reads and processes events from the stream
func (c *RedisStreamConsumer) consumeLoop(ctx context.Context) {
	for c.running {
		select {
		case <-c.stopChan:
			return
		default:
			if err := c.readAndProcessMessages(ctx); err != nil {
				log.Printf("Error processing messages: %v", err)
				time.Sleep(1 * time.Second) // Backoff on error
			}
		}
	}
}

// readAndProcessMessages reads messages from the stream and processes them
func (c *RedisStreamConsumer) readAndProcessMessages(ctx context.Context) error {
	streams, err := c.client.XReadGroup(ctx, &redis.XReadGroupArgs{
		Group:    c.consumerGroup,
		Consumer: c.consumerName,
		Streams:  []string{c.stream, ">"},
		Count:    10,
		Block:    1 * time.Second,
	}).Result()

	if err != nil {
		if err == redis.Nil {
			return nil // No new messages
		}
		return err
	}

	for _, stream := range streams {
		for _, message := range stream.Messages {
			if err := c.processMessage(ctx, message); err != nil {
				log.Printf("Error processing message %s: %v", message.ID, err)
				continue
			}

			// Acknowledge the message
			if err := c.client.XAck(ctx, c.stream, c.consumerGroup, message.ID).Err(); err != nil {
				log.Printf("Error acknowledging message %s: %v", message.ID, err)
			}
		}
	}

	return nil
}

// processMessage processes a single Redis Stream message
func (c *RedisStreamConsumer) processMessage(ctx context.Context, message redis.XMessage) error {
	eventData, exists := message.Values["data"].(string)
	if !exists {
		return fmt.Errorf("message %s missing event data", message.ID)
	}

	event, err := FromJSON([]byte(eventData))
	if err != nil {
		return fmt.Errorf("failed to deserialize event: %w", err)
	}

	handler, exists := c.handlers[event.Type]
	if !exists {
		log.Printf("No handler registered for event type: %s", event.Type)
		return nil
	}

	log.Printf("Processing event %s (ID: %s) from message %s", 
		event.Type, event.ID, message.ID)

	return handler(ctx, event)
}