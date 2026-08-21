import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { getRuntimeConfig } from './runtime-config';
import {
  P2pkhTraceRequest,
  P2pkhTraceResponse,
  TransactionContextResponse,
} from './trace-api.models';

@Injectable({ providedIn: 'root' })
export class TraceApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = getRuntimeConfig().apiBaseUrl.replace(/\/$/, '');

  loadP2pkhTrace(request: P2pkhTraceRequest): Observable<P2pkhTraceResponse> {
    return this.http.post<P2pkhTraceResponse>(`${this.apiBaseUrl}/api/v1/traces/p2pkh`, request);
  }

  loadTransactionContext(txid: string): Observable<TransactionContextResponse> {
    return this.http.get<TransactionContextResponse>(
      `${this.apiBaseUrl}/api/v1/transactions/${txid}/context`,
    );
  }
}
