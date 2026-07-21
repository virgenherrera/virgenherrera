import { inject, Provider } from '@angular/core';
import { HUB_ACTIONS } from '@vh/design-system';
import { profileSnapshotSchema } from '@vh/profile';
import profileJson from '@profile-data';
import { ProfileStore } from '../stores/profile.store';
import { LinkCtaAction } from './link-cta.action';

export function provideCtaActions(): Provider[] {
  const parsed = profileSnapshotSchema.parse(profileJson);
  const ctaLinks = parsed.links.filter((link) => link.cta);

  return ctaLinks.map((link, index) => ({
    provide: HUB_ACTIONS,
    useFactory: () => {
      const profileStore = inject(ProfileStore);

      return new LinkCtaAction(link, profileStore, index);
    },
    multi: true,
  }));
}
