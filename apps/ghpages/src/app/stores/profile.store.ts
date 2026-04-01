import { computed, inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withState,
} from "@ngrx/signals";
import profileJson from "@profile-data";
import type { ExperienceData, ProfileData } from "../types/profile.types";
import {
  secretsPayloadSchema,
  type SecretsPayload,
} from "../schemas/secrets-payload.schema";

interface ProfileState {
  profile: ProfileData;
  isPrivateView: boolean;
  email: string | null;
  phone: string | null;
  snackbarMessage: string | null;
}

const initialState: ProfileState = {
  profile: profileJson as ProfileData,
  isPrivateView: false,
  email: null,
  phone: null,
  snackbarMessage: null,
};

const SUMMARY_SENTENCES = 2;
const DESCRIPTION_MAX_LENGTH = 150;
const MAX_TECHNOLOGIES = 6;

function trimSummary(summary: string): string {
  const sentences = summary.split(/(?<=\.)\s+/);

  return sentences.slice(0, SUMMARY_SENTENCES).join(" ");
}

function trimExperience(experiences: ExperienceData[]): ExperienceData[] {
  return experiences.map((exp) => ({
    ...exp,
    description:
      exp.description.length > DESCRIPTION_MAX_LENGTH
        ? `${exp.description.slice(0, DESCRIPTION_MAX_LENGTH).trimEnd()}...`
        : exp.description,
    technologies: exp.technologies.slice(0, MAX_TECHNOLOGIES),
  }));
}

function decodeHashPayload(hash: string): SecretsPayload | null {
  if (!hash || hash === "#") return null;
  try {
    const base64 = hash.startsWith("#") ? hash.slice(1) : hash;
    const json = atob(base64);
    const parsed = JSON.parse(json) as unknown;

    return secretsPayloadSchema.parse(parsed);
  } catch {
    return null;
  }
}

export const ProfileStore = signalStore(
  { providedIn: "root" },
  withState(initialState),
  withComputed((store) => ({
    name: computed(() => store.profile().name),
    headline: computed(() => store.profile().headline),
    summary: computed(() =>
      store.isPrivateView()
        ? store.profile().summary
        : trimSummary(store.profile().summary),
    ),
    location: computed(() => store.profile().location),
    links: computed(() => store.profile().links),
    experience: computed(() =>
      store.isPrivateView()
        ? store.profile().experience
        : trimExperience(store.profile().experience),
    ),
    skills: computed(() => store.profile().skills),
    languages: computed(() => store.profile().languages),
    showPdfButton: computed(() => store.isPrivateView()),
  })),
  withHooks({
    onInit(store) {
      const platformId = inject(PLATFORM_ID);

      if (!isPlatformBrowser(platformId)) {
        return;
      }

      const applyHash = (): void => {
        const hash = window.location.hash;
        const payload = decodeHashPayload(hash);

        if (payload) {
          patchState(store, {
            isPrivateView: true,
            email: payload.email,
            phone: payload.phone,
          });
        } else if (hash && hash !== "#") {
          patchState(store, {
            isPrivateView: false,
            email: null,
            phone: null,
            snackbarMessage: "Invalid link — showing public version",
          });
          setTimeout(() => patchState(store, { snackbarMessage: null }), 4000);
        } else {
          patchState(store, {
            isPrivateView: false,
            email: null,
            phone: null,
          });
        }
      };

      applyHash();
      window.addEventListener("hashchange", applyHash);
    },
  }),
);
