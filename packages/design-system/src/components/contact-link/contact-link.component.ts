import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import type { LinkData } from '@vh/profile';
import { IconComponent } from '../icon/icon.component';
import { isIconName } from '../icon/icon-paths.constant';

const LINK_TARGET_ATTRS: Record<
  'blank' | 'self',
  { target: string | null; rel: string | null }
> = {
  blank: { target: '_blank', rel: 'noopener noreferrer' },
  self: { target: null, rel: null },
};

@Component({
  selector: 'vh-contact-link',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './contact-link.component.html',
  styleUrl: './contact-link.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ContactLinkComponent {
  readonly data = input.required<LinkData>();

  protected readonly label = computed(() => this.data().label);
  protected readonly url = computed(() => this.data().url);
  protected readonly iconName = computed(() => {
    const iconKey = this.data().icon;

    return iconKey && isIconName(iconKey) ? iconKey : undefined;
  });
  protected readonly targetAttr = computed(
    () => LINK_TARGET_ATTRS[this.data().target].target,
  );
  protected readonly relAttr = computed(
    () => LINK_TARGET_ATTRS[this.data().target].rel,
  );
}
