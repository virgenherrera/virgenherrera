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
import type { ProfileData } from "../types/profile.types";
import { SNACKBAR_DISMISS_MS } from "../constants/profile.constants";
import {
  trimSummary,
  trimExperience,
  decodeHashPayload,
} from "./profile.utils";

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
    education: computed(() => store.profile().education),
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
          setTimeout(
            () => patchState(store, { snackbarMessage: null }),
            SNACKBAR_DISMISS_MS,
          );
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
