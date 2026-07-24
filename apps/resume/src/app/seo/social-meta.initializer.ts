import { inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';

import { environment } from '../../environments/environment';
import { ProfileStore } from '../stores/profile.store';
import { truncateDescription } from './seo-meta.initializer';

export function socialMetaInitializer(): () => void {
  const meta = inject(Meta);
  const profileStore = inject(ProfileStore);

  return () => {
    const { name, headline, summary, experience } = profileStore.profile;
    const title = `${name} — ${experience[0].role}`;
    const description = truncateDescription(summary || headline);
    const imageUrl = `${environment.siteUrl}avatar.jpg`;
    const imageAlt = `Professional photo of ${name}`;

    // S1: Core Open Graph
    meta.updateTag({ property: 'og:title', content: title });
    meta.updateTag({ property: 'og:description', content: description });
    meta.updateTag({
      property: 'og:url',
      content: environment.siteUrl,
    });
    meta.updateTag({ property: 'og:type', content: 'profile' });
    meta.updateTag({ property: 'og:site_name', content: name });

    // S2: og:image
    meta.updateTag({ property: 'og:image', content: imageUrl });
    meta.updateTag({ property: 'og:image:width', content: '528' });
    meta.updateTag({ property: 'og:image:height', content: '528' });
    meta.updateTag({ property: 'og:image:type', content: 'image/jpeg' });

    // S3: Twitter Cards
    meta.updateTag({ name: 'twitter:card', content: 'summary' });
    meta.updateTag({ name: 'twitter:title', content: title });
    meta.updateTag({ name: 'twitter:description', content: description });
    meta.updateTag({ name: 'twitter:image', content: imageUrl });

    // S4: og:locale
    meta.updateTag({ property: 'og:locale', content: 'en_US' });

    // S5: Image alt text
    meta.updateTag({ property: 'og:image:alt', content: imageAlt });
    meta.updateTag({ name: 'twitter:image:alt', content: imageAlt });
  };
}
