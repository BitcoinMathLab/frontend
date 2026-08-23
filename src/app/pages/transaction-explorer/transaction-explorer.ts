import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';

import { TraceApi } from '../../core/trace-api';
import { TransactionContextResponse, TransactionExample } from '../../core/trace-api.models';
import {
  decodeTransactionBytes,
  describeTransactionByteField,
  TransactionByteField,
} from './transaction-byte-decoder';

const TXID_PATTERN = /^[0-9a-fA-F]{64}$/;
const DEFAULT_TXID = '40e331b67c0fe7750bb3b1943b378bf702dce86124dc12fa5980f975db7ec930';

@Component({
  selector: 'app-transaction-explorer',
  imports: [FormsModule],
  templateUrl: './transaction-explorer.html',
  styleUrl: './transaction-explorer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionExplorer implements OnInit, OnDestroy {
  private readonly traceApi = inject(TraceApi);
  private requestSubscription: Subscription | undefined;
  private examplesSubscription: Subscription | undefined;
  private copiedTimeout: ReturnType<typeof setTimeout> | undefined;
  private byteCopiedTimeout: ReturnType<typeof setTimeout> | undefined;

  protected txid = DEFAULT_TXID;
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly result = signal<TransactionContextResponse | null>(null);
  protected readonly copied = signal(false);
  protected readonly copiedByteFieldId = signal<string | null>(null);
  protected readonly examples = signal<readonly TransactionExample[]>([]);
  protected readonly selectedExample = signal<TransactionExample | null>(null);
  protected readonly selectedByteFieldId = signal<string | null>(null);
  protected readonly byteFields = computed<readonly TransactionByteField[]>(() => {
    const transaction = this.result();
    if (!transaction) {
      return [];
    }
    if (transaction.byte_fields?.length) {
      return transaction.byte_fields.map((field) => ({
        ...field,
        description: describeTransactionByteField(field),
      }));
    }
    try {
      return decodeTransactionBytes(transaction.transaction_hex);
    } catch {
      return [];
    }
  });
  protected readonly selectedByteField = computed(() => {
    const fields = this.byteFields();
    return fields.find((field) => field.id === this.selectedByteFieldId()) ?? fields[0] ?? null;
  });
  protected readonly selectedByteFieldIndex = computed(() => {
    const selected = this.selectedByteField();
    return selected ? this.byteFields().findIndex((field) => field.id === selected.id) : -1;
  });
  protected readonly fixtureVerification = computed(() => {
    const example = this.selectedExample();
    const transaction = this.result();
    if (!example || !transaction || transaction.txid !== example.txid) {
      return null;
    }
    const spendTypes = transaction.spent_outputs.map((output) => output.spend_type);
    const matches =
      transaction.spent_outputs.length === example.input_count &&
      transaction.outputs.length === example.output_count &&
      spendTypes.length === example.expected_spend_types.length &&
      spendTypes.every((spendType, index) => spendType === example.expected_spend_types[index]);
    return matches ? 'Fixture verified' : 'Fixture differs from its expected context';
  });

  ngOnInit(): void {
    this.examplesSubscription = this.traceApi.loadTransactionExamples().subscribe({
      next: (response) => this.examples.set(response.examples),
      error: () => this.examples.set([]),
    });
  }

  protected lookup(): void {
    const txid = this.txid.trim();
    this.txid = txid;
    this.error.set('');

    if (!TXID_PATTERN.test(txid)) {
      this.result.set(null);
      this.error.set('Enter a transaction ID containing exactly 64 hexadecimal characters.');
      return;
    }

    this.requestSubscription?.unsubscribe();
    this.result.set(null);
    this.loading.set(true);
    this.requestSubscription = this.traceApi
      .loadTransactionContext(txid.toLowerCase())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.result.set(response);
          this.selectedByteFieldId.set('version');
          this.copiedByteFieldId.set(null);
        },
        error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
      });
  }

  protected clear(): void {
    this.requestSubscription?.unsubscribe();
    this.txid = '';
    this.loading.set(false);
    this.error.set('');
    this.result.set(null);
    this.copied.set(false);
    this.copiedByteFieldId.set(null);
    this.selectedExample.set(null);
    this.selectedByteFieldId.set(null);
  }

  protected async copy(): Promise<void> {
    if (!navigator.clipboard) {
      this.error.set('Clipboard access is not available in this browser.');
      return;
    }
    try {
      await navigator.clipboard.writeText(this.txid.trim());
      this.copied.set(true);
      clearTimeout(this.copiedTimeout);
      this.copiedTimeout = setTimeout(() => this.copied.set(false), 1_500);
    } catch {
      this.error.set('The transaction ID could not be copied to the clipboard.');
    }
  }

  protected async paste(): Promise<void> {
    if (!navigator.clipboard) {
      this.error.set('Clipboard access is not available in this browser.');
      return;
    }
    try {
      this.replaceInput((await navigator.clipboard.readText()).trim());
    } catch {
      this.error.set('Clipboard permission was denied. Paste into the field directly instead.');
    }
  }

  protected random(): void {
    const candidates = this.examples().filter(
      (example) => example.txid !== this.txid.trim().toLowerCase(),
    );
    const example = candidates[Math.floor(Math.random() * candidates.length)];
    this.replaceInput(example?.txid ?? DEFAULT_TXID, example ?? null);
  }

  protected selectExample(example: TransactionExample): void {
    this.replaceInput(example.txid, example);
  }

  protected inputChanged(txid: string): void {
    if (this.selectedExample()?.txid !== txid.trim().toLowerCase()) {
      this.selectedExample.set(null);
    }
  }

  protected formatSats(amount: number): string {
    return new Intl.NumberFormat('en-CA').format(amount);
  }

  protected selectByteField(field: TransactionByteField): void {
    this.selectedByteFieldId.set(field.id);
  }

  protected selectByteFieldById(fieldId: string): void {
    if (this.byteFields().some((field) => field.id === fieldId)) {
      this.selectedByteFieldId.set(fieldId);
      document
        .getElementById('byte-inspector-heading')
        ?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }
  }

  protected navigateByteField(direction: -1 | 1): void {
    const fields = this.byteFields();
    const nextIndex = this.selectedByteFieldIndex() + direction;
    if (nextIndex >= 0 && nextIndex < fields.length) {
      this.selectedByteFieldId.set(fields[nextIndex].id);
    }
  }

  protected async copyByteField(field: TransactionByteField): Promise<void> {
    if (!navigator.clipboard) {
      this.error.set('Clipboard access is not available in this browser.');
      return;
    }
    try {
      await navigator.clipboard.writeText(field.hex);
      this.copiedByteFieldId.set(field.id);
      clearTimeout(this.byteCopiedTimeout);
      this.byteCopiedTimeout = setTimeout(() => this.copiedByteFieldId.set(null), 1_500);
    } catch {
      this.error.set('The selected transaction bytes could not be copied to the clipboard.');
    }
  }

  protected handleByteFieldKeydown(event: KeyboardEvent, currentIndex: number): void {
    const fields = this.byteFields();
    if (!['Home', 'End', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const targetIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? fields.length - 1
          : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
            ? Math.max(0, currentIndex - 1)
            : Math.min(fields.length - 1, currentIndex + 1);
    if (targetIndex === currentIndex) {
      return;
    }

    this.selectedByteFieldId.set(fields[targetIndex].id);
    const buttons = (
      event.currentTarget as HTMLElement
    ).parentElement?.querySelectorAll<HTMLButtonElement>('.byte-field');
    buttons?.item(targetIndex).focus();
  }

  ngOnDestroy(): void {
    this.requestSubscription?.unsubscribe();
    this.examplesSubscription?.unsubscribe();
    clearTimeout(this.copiedTimeout);
    clearTimeout(this.byteCopiedTimeout);
  }

  private replaceInput(txid: string, example: TransactionExample | null = null): void {
    this.requestSubscription?.unsubscribe();
    this.txid = txid;
    this.loading.set(false);
    this.error.set('');
    this.result.set(null);
    this.copied.set(false);
    this.copiedByteFieldId.set(null);
    this.selectedExample.set(example);
    this.selectedByteFieldId.set(null);
  }

  private messageFor(error: HttpErrorResponse): string {
    if (error.status === 422) {
      return 'That transaction ID is not valid. Check all 64 hexadecimal characters.';
    }
    if (error.status === 503) {
      return 'Bitcoin Core is still catching up or unavailable. Try this transaction again later.';
    }
    return 'The transaction could not be loaded. Check the ID and try again.';
  }
}
