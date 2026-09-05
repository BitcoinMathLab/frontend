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

  it('posts native witness context to the P2WPKH trace endpoint', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(TraceApi);

    service.loadP2wpkhTrace(CURATED_P2PKH_REQUEST).subscribe();

    const request = TestBed.inject(HttpTestingController).expectOne('/api/v1/traces/p2wpkh');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(CURATED_P2PKH_REQUEST);
    request.flush({});
  });

  it('posts bare multisig context to the P2MS trace endpoint', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(TraceApi);

    service.loadP2msTrace(CURATED_P2PKH_REQUEST).subscribe();

    const request = TestBed.inject(HttpTestingController).expectOne('/api/v1/traces/p2ms');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(CURATED_P2PKH_REQUEST);
    request.flush({});
  });

  it('posts a candidate DER signature with complete spend context', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(TraceApi);
    const verificationRequest = {
      ...CURATED_P2PKH_REQUEST,
      der_signature_hex: '3006020101020101',
    };

    service.verifyEcdsaSignature(verificationRequest).subscribe();

    const request = TestBed.inject(HttpTestingController).expectOne(
      '/api/v1/signatures/ecdsa/verify',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(verificationRequest);
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
