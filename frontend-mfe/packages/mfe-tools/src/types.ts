export interface MfeConfig {
  name: string;
  dirname: string;
  port: number;
  exposes?: Record<string, string>;
  remotes?: Record<string, string>;
  shared?: Record<string, any>;
  isDevelopment?: boolean;
}

export interface SharedDependency {
  singleton?: boolean;
  requiredVersion?: string;
  eager?: boolean;
}