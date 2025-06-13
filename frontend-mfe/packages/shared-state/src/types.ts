export interface EventBusEvent {
  type: string;
  payload: any;
  timestamp: number;
  source: string;
}

export interface GlobalState {
  user: {
    id: string | null;
    email: string | null;
    role: string | null;
    isAuthenticated: boolean;
  };
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
  timestamp: number;
}