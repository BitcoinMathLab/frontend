import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  BITCOIN_OBJECT_FIXTURES,
  fixtureById,
  fixtureForKind,
  fixtureForRoute,
} from '../../core/bitcoin-object-fixtures';
import { transientObjectFixture } from '../../core/transient-object-fixtures';
import { BitcoinObjectDisplay } from '../../features/bitcoin-object-display/bitcoin-object-display';
import {
  BITCOIN_OBJECT_KINDS,
  BitcoinObjectFixture,
  BitcoinObjectKind,
  BitcoinObjectReference,
} from '../../features/bitcoin-object-display/bitcoin-object-display.models';
import { BitcoinObjectModal } from '../../features/bitcoin-object-display/bitcoin-object-modal';

@Component({
  selector: 'app-display',
  imports: [BitcoinObjectDisplay, BitcoinObjectModal, FormsModule],
  templateUrl: './display.html',
  styleUrl: './display.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Display implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly kinds = BITCOIN_OBJECT_KINDS;
  protected readonly activeKind = signal<BitcoinObjectKind>('block');
  protected readonly activeFixture = signal<BitcoinObjectFixture>(fixtureForKind('block'));
  protected readonly modalFixture = signal<BitcoinObjectFixture | null>(null);
  protected readonly routeUnavailable = signal(false);
  protected readonly selectorError = signal('');
  protected readonly selectorInvalidField = signal<'id' | 'index' | null>(null);
  protected readonly selectorIdCopied = signal(false);
  protected selectorId = this.activeFixture().identifier;
  protected selectorIndex = '';
  private directRoute = false;
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;

  ngOnInit(): void {
    const routeKind = this.route.snapshot.data['objectKind'] as
      'block' | 'transaction' | 'tx-input' | 'tx-output' | undefined;
    if (!routeKind) return;
    this.directRoute = true;
    const identifier =
      this.route.snapshot.paramMap.get('hash') ?? this.route.snapshot.paramMap.get('txid');
    const indexParam = this.route.snapshot.paramMap.get('index');
    const index = indexParam === null ? undefined : Number(indexParam);
    const fixture = identifier
      ? (fixtureForRoute(routeKind, identifier, index) ??
        transientObjectFixture(
          routeKind,
          routeKind === 'tx-input' || routeKind === 'tx-output'
            ? `${identifier}:${index ?? ''}`
            : identifier,
        ))
      : undefined;
    if (fixture) {
      this.activeKind.set(fixture.kind);
      this.activeFixture.set(fixture);
      this.syncSelector(fixture);
    } else {
      this.activeKind.set(routeKind);
      this.activeFixture.set(fixtureForKind(routeKind));
      this.selectorId = identifier ?? '';
      this.selectorIndex = indexParam ?? '';
      this.routeUnavailable.set(true);
    }
  }

  protected selectKind(kind: BitcoinObjectKind): void {
    this.activeKind.set(kind);
    const fixture = fixtureForKind(kind);
    this.activeFixture.set(fixture);
    this.syncSelector(fixture);
    this.routeUnavailable.set(false);
    this.selectorError.set('');
    this.selectorInvalidField.set(null);
    this.selectorIdCopied.set(false);
    if (this.directRoute) {
      this.directRoute = false;
      void this.router.navigateByUrl('/display');
    }
  }

  protected selectorIdChanged(value: string): void {
    this.selectorId = value;
    this.selectorError.set('');
    this.selectorInvalidField.set(null);
    this.selectorIdCopied.set(false);
  }

  protected selectorIndexChanged(value: string): void {
    this.selectorIndex = value;
    this.selectorError.set('');
    this.selectorInvalidField.set(null);
  }

  protected displaySelection(): void {
    const kind = this.activeKind();
    const normalized = this.selectorId.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(normalized)) {
      this.selectorError.set(`Enter a 64-character hexadecimal ${this.selectorIdLabel()}.`);
      this.selectorInvalidField.set('id');
      return;
    }

    const index = this.selectorUsesIndex() ? this.validSelectorIndex() : undefined;
    if (this.selectorUsesIndex() && index === undefined) {
      this.selectorError.set(`Enter a non-negative ${this.selectorIndexLabel().toLowerCase()}.`);
      this.selectorInvalidField.set('index');
      return;
    }

    const fixture = fixtureForRoute(kind, normalized, index);
    if (!fixture) {
      this.selectorError.set(
        `That ${this.selectorObjectLabel()} is not available in the Stage 1 display.`,
      );
      this.selectorInvalidField.set(null);
      return;
    }
    this.syncSelector(fixture);
    this.activeFixture.set(fixture);
    this.routeUnavailable.set(false);
    this.selectorError.set('');
    this.selectorInvalidField.set(null);
  }

  protected clearSelector(): void {
    this.selectorId = '';
    this.selectorIndex = '';
    this.selectorError.set('');
    this.selectorInvalidField.set(null);
    this.selectorIdCopied.set(false);
  }

  protected async copySelectorId(): Promise<void> {
    if (!navigator.clipboard) {
      this.selectorError.set('Clipboard access is not available in this browser.');
      return;
    }
    try {
      await navigator.clipboard.writeText(this.selectorId.trim());
      this.selectorIdCopied.set(true);
      clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => this.selectorIdCopied.set(false), 1_500);
    } catch {
      this.selectorError.set(`The ${this.selectorIdLabel()} could not be copied to the clipboard.`);
    }
  }

  protected async pasteSelectorId(): Promise<void> {
    if (!navigator.clipboard) {
      this.selectorError.set('Clipboard access is not available in this browser.');
      return;
    }
    try {
      this.selectorIdChanged((await navigator.clipboard.readText()).trim());
    } catch {
      this.selectorError.set(
        'Clipboard permission was denied. Paste into the field directly instead.',
      );
    }
  }

  protected randomSelection(): void {
    const fixtures = BITCOIN_OBJECT_FIXTURES.filter(
      (fixture) => fixture.kind === this.activeKind(),
    );
    const candidates = fixtures.filter((fixture) => fixture.id !== this.activeFixture().id);
    const fixture = candidates[Math.floor(Math.random() * candidates.length)] ?? fixtures[0];
    if (!fixture) return;
    this.syncSelector(fixture);
    this.activeFixture.set(fixture);
    this.routeUnavailable.set(false);
    this.selectorError.set('');
    this.selectorInvalidField.set(null);
    this.selectorIdCopied.set(false);
  }

  protected selectorUsesIndex(): boolean {
    return this.activeKind() === 'tx-input' || this.activeKind() === 'tx-output';
  }

  protected selectorIdLabel(): string {
    return this.activeKind() === 'block' ? 'block ID' : 'transaction ID';
  }

  protected selectorInputId(): string {
    return this.activeKind() === 'block' ? 'block-id' : 'transaction-id';
  }

  protected selectorIndexLabel(): string {
    return this.activeKind() === 'tx-input' ? 'Input index' : 'Output index';
  }

  protected selectorObjectLabel(): string {
    const labels: Record<BitcoinObjectKind, string> = {
      block: 'block ID',
      transaction: 'transaction ID',
      'tx-input': 'transaction input',
      'tx-output': 'transaction output',
    };
    return labels[this.activeKind()];
  }

  protected handleTabKeydown(event: KeyboardEvent, index: number): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? this.kinds.length - 1
          : event.key === 'ArrowLeft'
            ? (index - 1 + this.kinds.length) % this.kinds.length
            : (index + 1) % this.kinds.length;
    this.selectKind(this.kinds[nextIndex].kind);
    const tabs = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll(
      '[role="tab"]',
    );
    (tabs?.item(nextIndex) as HTMLElement | undefined)?.focus();
  }

  protected openReference(reference: BitcoinObjectReference): void {
    const fixture = fixtureById(reference.fixtureId);
    if (fixture) this.modalFixture.set(fixture);
  }

  protected closeModal(): void {
    this.modalFixture.set(null);
  }

  ngOnDestroy(): void {
    clearTimeout(this.copiedTimer);
  }

  private syncSelector(fixture: BitcoinObjectFixture): void {
    if (fixture.kind === 'tx-input' || fixture.kind === 'tx-output') {
      const separator = fixture.identifier.lastIndexOf(':');
      this.selectorId = fixture.identifier.slice(0, separator);
      this.selectorIndex = fixture.identifier.slice(separator + 1);
      return;
    }
    this.selectorId = fixture.identifier;
    this.selectorIndex = '';
  }

  private validSelectorIndex(): number | undefined {
    const value = this.selectorIndex.trim();
    if (!/^\d+$/.test(value)) return undefined;
    const index = Number(value);
    return Number.isSafeInteger(index) ? index : undefined;
  }
}
