import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { finalize, Subscription } from 'rxjs';

import { TraceApi } from '../../core/trace-api';
import { OpcodeTraceResponse, StackSnapshot } from '../../core/trace-api.models';
import { StackView } from '../stack-view/stack-view';

type Destination = 'flow' | 'main' | 'alt';
interface ItemDetail {
  readonly location: string;
  readonly value: string;
  readonly type: string;
  readonly scriptEncoding: string | null;
  readonly truthiness: string;
  readonly text: string;
}

interface SandboxState {
  readonly flowData: readonly string[];
  readonly mainStack: readonly string[];
  readonly altStack: readonly string[];
}

const DEFAULT_DATA = 'a1b2c3d4';

@Component({
  selector: 'app-opcode-sandbox',
  imports: [StackView],
  templateUrl: './opcode-sandbox.html',
  styleUrl: './opcode-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpcodeSandbox implements OnDestroy {
  private readonly traceApi = inject(TraceApi);
  private requestSubscription: Subscription | undefined;

  protected readonly dataHex = signal(DEFAULT_DATA);
  protected readonly destination = signal<Destination>('main');
  protected readonly flowData = signal<readonly string[]>([]);
  protected readonly mainStack = signal<readonly string[]>([DEFAULT_DATA]);
  protected readonly altStack = signal<readonly string[]>([]);
  protected readonly response = signal<OpcodeTraceResponse | null>(null);
  protected readonly running = signal(false);
  protected readonly error = signal('');
  protected readonly selectedDetail = signal<ItemDetail | null>(null);
  protected readonly history = signal<readonly SandboxState[]>([]);
  protected readonly status = computed(() => {
    if (this.running()) return 'Running';
    const response = this.response();
    if (!response) return 'Ready';
    return response.trace.success ? 'Executed' : 'Stopped';
  });
  protected readonly displayedMain = computed(() => this.finalSnapshot('main'));
  protected readonly displayedAlt = computed(() => this.finalSnapshot('alt'));

  protected updateData(event: Event): void {
    this.dataHex.set((event.target as HTMLInputElement).value.trim());
  }

  protected updateDestination(event: Event): void {
    this.destination.set((event.target as HTMLSelectElement).value as Destination);
  }

  protected randomize(): void {
    const bytes = crypto.getRandomValues(new Uint8Array(4));
    this.dataHex.set([...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join(''));
  }

  protected addData(): void {
    const value = this.dataHex().toLowerCase();
    if (!/^(?:[0-9a-f]{2}){1,520}$/.test(value)) {
      this.error.set('Enter 1–520 bytes of even-length hexadecimal data.');
      return;
    }

    this.rememberState();
    const destination = this.destination();
    if (destination === 'flow') this.flowData.update((items) => [...items, value]);
    if (destination === 'main') this.mainStack.update((items) => [value, ...items]);
    if (destination === 'alt') this.altStack.update((items) => [value, ...items]);
    this.resetResult();
  }

  protected remove(destination: Destination, index: number): void {
    const items = this.itemsFor(destination);
    if (!items[index]) return;
    this.rememberState();
    const removeAt = (items: readonly string[]) =>
      items.filter((_, itemIndex) => itemIndex !== index);
    if (destination === 'flow') this.flowData.update(removeAt);
    if (destination === 'main') this.mainStack.update(removeAt);
    if (destination === 'alt') this.altStack.update(removeAt);
    this.resetResult();
  }

  protected clear(destination: Destination): void {
    if (this.itemsFor(destination).length === 0) return;
    this.rememberState();
    if (destination === 'flow') this.flowData.set([]);
    if (destination === 'main') this.mainStack.set([]);
    if (destination === 'alt') this.altStack.set([]);
    this.resetResult();
  }

  protected move(destination: Destination, index: number, offset: -1 | 1): void {
    const items = [...this.itemsFor(destination)];
    const destinationIndex = index + offset;
    if (destinationIndex < 0 || destinationIndex >= items.length) return;
    this.rememberState();
    [items[index], items[destinationIndex]] = [items[destinationIndex], items[index]];
    if (destination === 'flow') this.flowData.set(items);
    if (destination === 'main') this.mainStack.set(items);
    if (destination === 'alt') this.altStack.set(items);
    this.resetResult();
  }

  protected inspect(location: string, value: string, inScriptFlow = false): void {
    this.selectedDetail.set({
      location,
      value,
      type: inScriptFlow ? 'Script data push' : 'Stack byte vector',
      scriptEncoding: inScriptFlow ? `${this.pushPrefix(value)}${value}` : null,
      truthiness: this.isTruthy(value) ? 'True' : 'False',
      text: this.printableText(value),
    });
  }

  @HostListener('document:keydown.escape')
  protected closeDetail(): void {
    this.selectedDetail.set(null);
  }

  protected pushOpcode(value: string): string {
    const bytes = value.length / 2;
    if (bytes <= 75) return `OP_PUSHBYTES_${bytes}`;
    if (bytes <= 0xff) return 'OP_PUSHDATA1';
    return 'OP_PUSHDATA2';
  }

  protected run(): void {
    this.requestSubscription?.unsubscribe();
    this.running.set(true);
    this.error.set('');
    this.requestSubscription = this.traceApi
      .traceOpcode({
        opcode: 'OP_DUP',
        flow_data: this.flowData(),
        main_stack: this.mainStack(),
        alt_stack: this.altStack(),
      })
      .pipe(finalize(() => this.running.set(false)))
      .subscribe({
        next: (response) => this.response.set(response),
        error: () => this.error.set('The opcode sandbox API is unavailable.'),
      });
  }

  protected reset(): void {
    this.rememberState();
    this.dataHex.set(DEFAULT_DATA);
    this.destination.set('main');
    this.flowData.set([]);
    this.mainStack.set([DEFAULT_DATA]);
    this.altStack.set([]);
    this.selectedDetail.set(null);
    this.running.set(false);
    this.resetResult();
  }

  protected undo(): void {
    const history = this.history();
    const previous = history.at(-1);
    if (!previous) return;
    this.history.set(history.slice(0, -1));
    this.flowData.set(previous.flowData);
    this.mainStack.set(previous.mainStack);
    this.altStack.set(previous.altStack);
    this.selectedDetail.set(null);
    this.resetResult();
  }

  ngOnDestroy(): void {
    this.requestSubscription?.unsubscribe();
  }

  private resetResult(): void {
    this.requestSubscription?.unsubscribe();
    this.requestSubscription = undefined;
    this.running.set(false);
    this.response.set(null);
    this.error.set('');
  }

  private rememberState(): void {
    const next = [
      ...this.history(),
      {
        flowData: [...this.flowData()],
        mainStack: [...this.mainStack()],
        altStack: [...this.altStack()],
      },
    ];
    this.history.set(next.slice(-20));
  }

  private itemsFor(destination: Destination): readonly string[] {
    if (destination === 'flow') return this.flowData();
    if (destination === 'main') return this.mainStack();
    return this.altStack();
  }

  private pushPrefix(value: string): string {
    const bytes = value.length / 2;
    if (bytes <= 75) return bytes.toString(16).padStart(2, '0');
    if (bytes <= 0xff) return `4c${bytes.toString(16).padStart(2, '0')}`;
    return `4d${(bytes & 0xff).toString(16).padStart(2, '0')}${(bytes >> 8)
      .toString(16)
      .padStart(2, '0')}`;
  }

  private isTruthy(value: string): boolean {
    const bytes = value.match(/../g)?.map((byte) => Number.parseInt(byte, 16)) ?? [];
    return bytes.some(
      (byte, index) => byte !== 0 && !(index === bytes.length - 1 && byte === 0x80),
    );
  }

  private printableText(value: string): string {
    const bytes = value.match(/../g)?.map((byte) => Number.parseInt(byte, 16)) ?? [];
    return bytes.length && bytes.every((byte) => byte >= 0x20 && byte <= 0x7e)
      ? String.fromCharCode(...bytes)
      : 'Not printable ASCII';
  }

  private finalSnapshot(stack: 'main' | 'alt'): StackSnapshot {
    const steps = this.response()?.trace.steps;
    if (steps?.length) return steps[steps.length - 1].stacks.after[stack];
    const items = stack === 'main' ? this.mainStack() : this.altStack();
    return { depth: items.length, items };
  }
}
