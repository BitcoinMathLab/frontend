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
      apiBaseUrl: 'https://api.bitcoinmathlab.com/',
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
      'https://api.bitcoinmathlab.com/api/v1/traces/p2pkh',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(CURATED_P2PKH_REQUEST);
    request.flush({});
  });
});
