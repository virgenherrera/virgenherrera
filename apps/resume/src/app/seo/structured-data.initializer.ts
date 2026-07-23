import { inject, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { environment } from '../../environments/environment';
import { ProfileStore } from '../stores/profile.store';

export function structuredDataInitializer(): () => void {
  const rendererFactory = inject(RendererFactory2);
  const doc = inject(DOCUMENT);
  const profileStore = inject(ProfileStore);

  return () => {
    const renderer = rendererFactory.createRenderer(null, null);
    const profile = profileStore.profile;
    const siteUrl = environment.siteUrl;

    const person: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      // D1: Core Person
      name: profile.name,
      url: siteUrl,
      image: `${siteUrl}avatar.jpg`,
      jobTitle: profile.experience[0]?.role ?? profile.headline,
      description: profile.summary,
    };

    // D2: worksFor (from experience[0] — current employer)
    if (profile.experience.length > 0) {
      const current = profile.experience[0];
      person['worksFor'] = {
        '@type': 'Organization',
        name: current.company,
      };
    }

    // D3: alumniOf (from education)
    if (profile.education.length > 0) {
      person['alumniOf'] = profile.education.map((edu) => ({
        '@type': 'EducationalOrganization',
        name: edu.institution,
      }));
    }

    // D4: knowsAbout (from skills — flatten skill names across categories)
    if (profile.skills.length > 0) {
      person['knowsAbout'] = profile.skills.flatMap(
        (category) => category.skills,
      );
    }

    // D5: hasCredential (from certifications — WITH GUARD for empty array)
    if (profile.certifications.length > 0) {
      person['hasCredential'] = profile.certifications.map((cert) => ({
        '@type': 'EducationalOccupationalCredential',
        name: cert.name,
        credentialCategory: 'certification',
      }));
    }

    // D6: knowsLanguage (from languages)
    if (profile.languages.length > 0) {
      person['knowsLanguage'] = profile.languages.map((lang) => lang.language);
    }

    // Inject via Renderer2 (safe for Angular — innerHTML would be sanitized).
    // This initializer runs on BOTH the server (prerender) and the client
    // (hydration) — the prerendered <script> survives hydration since it
    // isn't Angular-managed content, so without this guard the client run
    // would append a second, duplicate <script> tag.
    const existing = doc.head.querySelector(
      'script[type="application/ld+json"]',
    );

    if (existing) {
      existing.textContent = JSON.stringify(person);

      return;
    }

    const script = renderer.createElement('script');
    renderer.setAttribute(script, 'type', 'application/ld+json');
    renderer.appendChild(script, renderer.createText(JSON.stringify(person)));
    renderer.appendChild(doc.head, script);
  };
}
