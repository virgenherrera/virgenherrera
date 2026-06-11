import {
  computed,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import profileJson from "@profile-data";
import type {
  ExperienceData,
  LanguageData,
  LinkData,
  ProfileData,
  SkillCategoryData,
  EducationData,
} from "../types/profile.types";
import { SNACKBAR_DISMISS_MS } from "../constants/profile.constants";
import {
  trimSummary,
  trimExperience,
  decodeHashPayload,
} from "./profile.utils";

@Injectable({ providedIn: "root" })
export class ProfileStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly _profile = signal<ProfileData>(profileJson);
  private readonly _isPrivateView = signal(false);
  private readonly _email = signal<string | null>(null);
  private readonly _phone = signal<string | null>(null);
  private readonly _snackbarMessage = signal<string | null>(null);

  readonly isPrivateView = this._isPrivateView.asReadonly();
  readonly email = this._email.asReadonly();
  readonly phone = this._phone.asReadonly();
  readonly snackbarMessage = this._snackbarMessage.asReadonly();

  readonly name = computed(() => this._profile().name);
  readonly headline = computed(() => this._profile().headline);
  readonly summary = computed(() =>
    this._isPrivateView()
      ? this._profile().summary
      : trimSummary(this._profile().summary),
  );
  readonly location = computed(() => this._profile().location);
  readonly links = computed<LinkData[]>(() => this._profile().links);
  readonly experience = computed<ExperienceData[]>(() =>
    this._isPrivateView()
      ? this._profile().experience
      : trimExperience(this._profile().experience),
  );
  readonly skills = computed<SkillCategoryData[]>(() => this._profile().skills);
  readonly languages = computed<LanguageData[]>(
    () => this._profile().languages,
  );
  readonly education = computed<EducationData[]>(
    () => this._profile().education,
  );
  readonly showPdfButton = computed(() => this._isPrivateView());

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.applyHash();
    window.addEventListener("hashchange", () => this.applyHash());
  }

  private applyHash(): void {
    const hash = window.location.hash;
    const payload = decodeHashPayload(hash);

    if (payload) {
      this._isPrivateView.set(true);
      this._email.set(payload.email);
      this._phone.set(payload.phone);
    } else if (hash && hash !== "#") {
      this._isPrivateView.set(false);
      this._email.set(null);
      this._phone.set(null);
      this._snackbarMessage.set("Invalid link — showing public version");
      setTimeout(() => this._snackbarMessage.set(null), SNACKBAR_DISMISS_MS);
    } else {
      this._isPrivateView.set(false);
      this._email.set(null);
      this._phone.set(null);
    }
  }
}
