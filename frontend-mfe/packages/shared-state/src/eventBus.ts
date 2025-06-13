import mitt, { Emitter } from 'mitt';
import { EventBusEvent } from './types';

class EventBus {
  private emitter: Emitter<Record<string, EventBusEvent>>;
  private source: string;

  constructor(source: string = 'unknown') {
    this.emitter = mitt();
    this.source = source;
  }

  emit(type: string, payload: any): void {
    const event: EventBusEvent = {
      type,
      payload,
      timestamp: Date.now(),
      source: this.source,
    };

    console.log(`[EventBus] Emitting ${type} from ${this.source}:`, payload);
    this.emitter.emit(type, event);
  }

  on(type: string, handler: (event: EventBusEvent) => void): void {
    console.log(`[EventBus] Registering handler for ${type} in ${this.source}`);
    this.emitter.on(type, handler);
  }

  off(type: string, handler: (event: EventBusEvent) => void): void {
    this.emitter.off(type, handler);
  }

  clear(): void {
    this.emitter.all.clear();
  }
}

// Global event bus instance
export const eventBus = new EventBus('global');

// Factory function for creating MFE-specific event buses
export const createEventBus = (source: string): EventBus => {
  return new EventBus(source);
};