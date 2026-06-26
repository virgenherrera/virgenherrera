import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { z } from 'zod';
import { profileSchema, secretsPayloadSchema } from '@vh/profile';
import profileJson from '@profile-data';

const hashPayloadSchema = z
  .string()
  .transform((hash) => (hash.startsWith('#') ? hash.slice(1) : hash))
  .transform((base64) => {
    try {
      return JSON.parse(atob(base64)) as unknown;
    } catch {
      return null;
    }
  })
  .pipe(secretsPayloadSchema);

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly platformId = inject(PLATFORM_ID);

  readonly profile = profileSchema.parse(profileJson);
  readonly isPrivateView = signal(false);
  readonly email = signal<string | null>(null);
  readonly phone = signal<string | null>(null);
  readonly snackbarMessage = signal<string | null>(null);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.applyHash();
    window.addEventListener('hashchange', () => this.applyHash());
  }

  private applyHash(): void {
    const hash = window.location.hash;
    const result = hashPayloadSchema.safeParse(hash);

    if (result.success) {
      this.isPrivateView.set(true);
      this.email.set(result.data.email);
      this.phone.set(result.data.phone);

      return;
    }

    this.isPrivateView.set(false);
    this.email.set(null);
    this.phone.set(null);

    if (hash && hash !== '#') {
      this.snackbarMessage.set('Invalid link — showing public version');
      setTimeout(() => this.snackbarMessage.set(null), 4000);
    }
  }
}
