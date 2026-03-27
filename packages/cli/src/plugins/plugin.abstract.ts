import type { ProfileData } from "@virgenherrera/profile";

export interface PluginResult {
  readonly fileName: string;
  readonly content: string;
}

export abstract class ProfilePlugin {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract generate(profile: ProfileData): Promise<PluginResult>;
}
