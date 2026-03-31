import { computed, inject, Injectable, signal } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { filter, map } from "rxjs";
import profileJson from "@profile-data";
import type { ProfileData } from "../types/profile.types";

@Injectable({ providedIn: "root" })
export class ProfileStore {
  private readonly router = inject(Router);

  readonly profile = signal<ProfileData>(profileJson as ProfileData);

  private readonly routerUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly isPrivateView = computed(() =>
    this.routerUrl().includes("/private"),
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
