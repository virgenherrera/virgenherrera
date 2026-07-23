import { inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';

import { ProfileStore } from '../stores/profile.store';

const META_DESCRIPTION_MAX_LENGTH = 155;

export function truncateDescription(
  text: string,
  maxLength = META_DESCRIPTION_MAX_LENGTH,
): string {
  if (text.length <= maxLength) return text;

  // reserve 1 char for the trailing ellipsis so the result stays <= maxLength
  const truncated = text.slice(0, maxLength - 1);
  const lastSpace = truncated.lastIndexOf(' ');
  const boundary = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;

  return `${boundary}…`;
}

export function seoMetaInitializer(): () => void {
  const meta = inject(Meta);
  const profileStore = inject(ProfileStore);

  return () => {
    const { summary, headline } = profileStore.profile;
    const content = truncateDescription(summary || headline);

    meta.updateTag({ name: 'description', content });
  };
}
