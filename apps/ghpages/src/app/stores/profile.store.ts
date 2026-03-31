import {
  computed,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import profileJson from "@profile-data";
import type { ProfileData } from "../types/profile.types";

const PRIVATE_HASH = "#full";

@Injectable({ providedIn: "root" })
export class ProfileStore {
  private readonly platformId = inject(PLATFORM_ID);

  readonly profile = signal<ProfileData>(profileJson as ProfileData);

  readonly isPrivateView = signal(
    isPlatformBrowser(this.platformId) && window.location.hash === PRIVATE_HASH,
  );

  readonly name = computed(() => this.profile().name);
  readonly headline = computed(() => this.profile().headline);
  readonly summary = computed(() => this.profile().summary);
  readonly location = computed(() => this.profile().location);
  readonly links = computed(() => this.profile().links);
  readonly experience = computed(() => this.profile().experience);
  readonly skills = computed(() => this.profile().skills);
  readonly languages = computed(() => this.profile().languages);

  readonly email = computed(() =>
    this.isPrivateView() ? (this.profile().email ?? null) : null,
  );
  readonly showPdfButton = computed(() => this.isPrivateView());
}
