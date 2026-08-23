import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TraceApi } from '../../core/trace-api';
import { OpcodeTraceResponse } from '../../core/trace-api.models';
import { OpcodeSandbox } from './opcode-sandbox';

const response: OpcodeTraceResponse = {
  api_version: 'v1',
  mode: 'opcode',
  opcode: 'OP_DUP',
  initial_stacks: {
    main: { depth: 1, items: ['a1b2c3d4'] },
    alt: { depth: 0, items: [] },
  },
  trace: {
    schema_version: 1,
    script: '76',
    success: true,
    diagnostic: null,
    steps: [
      {
        index: 0,
        opcode: {
          name: 'OP_DUP',
          value: 118,
          hex: '0x76',
          byte_offset: 0,
          byte_length: 1,
          raw: '76',
          is_push: false,
          push_data: null,
        },
        stacks: {
          before: {
            main: { depth: 1, items: ['a1b2c3d4'] },
            alt: { depth: 0, items: [] },
          },
          after: {
            main: { depth: 2, items: ['a1b2c3d4', 'a1b2c3d4'] },
            alt: { depth: 0, items: [] },
          },
        },
        explanation: 'Copy the top item.',
        diagnostic: null,
      },
    ],
  },
};

describe('OpcodeSandbox', () => {
  it('adds typed data to flow, infers its push, and runs OP_DUP through the API', async () => {
    const traceOpcode = vi.fn().mockReturnValue(of(response));
    await TestBed.configureTestingModule({
      imports: [OpcodeSandbox],
      providers: [{ provide: TraceApi, useValue: { traceOpcode } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(OpcodeSandbox);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    input.value = 'aabb';
    input.dispatchEvent(new Event('input'));
    select.value = 'flow';
    select.dispatchEvent(new Event('change'));
    [...fixture.nativeElement.querySelectorAll('button')]
      .find((button: HTMLButtonElement) => button.textContent?.includes('Add data'))
      ?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('OP_PUSHBYTES_2');
    [...fixture.nativeElement.querySelectorAll('button')]
      .find((button: HTMLButtonElement) => button.textContent?.includes('Run OP_DUP'))
      ?.click();
    fixture.detectChanges();

    expect(traceOpcode).toHaveBeenCalledWith({
      opcode: 'OP_DUP',
      flow_data: ['aabb'],
      main_stack: ['a1b2c3d4'],
      alt_stack: [],
    });
    expect(fixture.nativeElement.textContent).toContain('Executed');
    expect(fixture.nativeElement.querySelectorAll('.stack-item')).toHaveLength(2);
  });

  it('opens data details and removes editable initial stack items', async () => {
    await TestBed.configureTestingModule({
      imports: [OpcodeSandbox],
      providers: [{ provide: TraceApi, useValue: { traceOpcode: vi.fn() } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(OpcodeSandbox);
    fixture.detectChanges();

    const inspect = fixture.nativeElement.querySelector('.edit-items button') as HTMLButtonElement;
    inspect.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]').textContent).toContain('4 bytes');

    const remove = fixture.nativeElement.querySelector(
      '[aria-label="Remove main stack item"]',
    ) as HTMLButtonElement;
    remove.click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[aria-label="Main stack result"]').textContent,
    ).toContain('empty');
  });
});
