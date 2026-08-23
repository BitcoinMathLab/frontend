import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CURATED_P2PKH_REQUEST } from './curated-p2pkh';
import { TraceApi } from './trace-api';

describe('TraceApi', () => {
  afterEach(() => {
    globalThis.__BML_CONFIG__ = undefined;
    TestBed.inject(HttpTestingController).verify();
  });

  it('posts the complete spend context to the configured v1 endpoint', () => {
    globalThis.__BML_CONFIG__ = {
      apiBaseUrl: 'https://api.btcmathlab.com/',
      sentryDsn: '',
      environment: 'test',
      release: '',
    };
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(TraceApi);

    service.loadP2pkhTrace(CURATED_P2PKH_REQUEST).subscribe();

    const request = TestBed.inject(HttpTestingController).expectOne(
      'https://api.btcmathlab.com/api/v1/traces/p2pkh',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(CURATED_P2PKH_REQUEST);
    request.flush({});
  });

  it('loads transaction context from the configured v1 endpoint', () => {
    globalThis.__BML_CONFIG__ = {
      apiBaseUrl: 'https://api.btcmathlab.com/',
      sentryDsn: '',
      environment: 'test',
      release: '',
    };
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(TraceApi);
    const txid = '40e331b67c0fe7750bb3b1943b378bf702dce86124dc12fa5980f975db7ec930';

    service.loadTransactionContext(txid).subscribe();

    const request = TestBed.inject(HttpTestingController).expectOne(
      `https://api.btcmathlab.com/api/v1/transactions/${txid}/context`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('posts editable stack state to the opcode trace endpoint', () => {
    globalThis.__BML_CONFIG__ = {
      apiBaseUrl: 'https://api.btcmathlab.com/',
      sentryDsn: '',
      environment: 'test',
      release: '',
    };
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(TraceApi);
    const body = {
      opcode: 'OP_DUP' as const,
      flow_data: ['aabb'],
      main_stack: ['01'],
      alt_stack: [],
    };

    service.traceOpcode(body).subscribe();

    const request = TestBed.inject(HttpTestingController).expectOne(
      'https://api.btcmathlab.com/api/v1/traces/opcode',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush({});
  });

  it('loads educational transaction examples from the configured v1 endpoint', () => {
    globalThis.__BML_CONFIG__ = {
      apiBaseUrl: 'https://api.btcmathlab.com/',
      sentryDsn: '',
      environment: 'test',
      release: '',
    };
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(TraceApi);

    service.loadTransactionExamples().subscribe();

    const request = TestBed.inject(HttpTestingController).expectOne(
      'https://api.btcmathlab.com/api/v1/transactions/examples',
    );
    expect(request.request.method).toBe('GET');
    request.flush({ api_version: 'v1', examples: [] });
  });
});
