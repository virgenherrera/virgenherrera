import {
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';
import type { CertificationData } from '@vh/profile';
import { ThemeStoreBase } from '../../types/hub-action';

type CredentialBadgeVariant = 'light' | 'dark';

interface BadgedCertification extends CertificationData {
  readonly url: string;
}

@Component({
  selector: 'vh-credential-badge',
  standalone: true,
  templateUrl: './credential-badge.component.html',
  styleUrl: './credential-badge.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class CredentialBadgeComponent {
  readonly certifications = input.required<readonly CertificationData[]>();

  private readonly themeStore = inject(ThemeStoreBase);

  protected readonly badgedCertifications = computed<
    readonly BadgedCertification[]
  >(() =>
    this.certifications().filter(
      (cert): cert is BadgedCertification =>
        Boolean(cert.badge) && Boolean(cert.url),
    ),
  );

  // Contrast mapping is intentionally inverted: a light page background
  // needs the dark/blue badge for contrast, a dark page background needs
  // the light/white badge.
  protected readonly variant = computed<CredentialBadgeVariant>(() =>
    this.themeStore.isDark() ? 'light' : 'dark',
  );

  protected readonly starsFill = computed(() =>
    this.variant() === 'light' ? '#00c3ff' : '#fff',
  );

  protected credentialLabel(cert: BadgedCertification): string {
    return `View ${cert.name} credential from ${cert.issuer} (opens in a new window)`;
  }
}
