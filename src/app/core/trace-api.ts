import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { getRuntimeConfig } from './runtime-config';
import {
  EcdsaSignatureVerificationRequest,
  EcdsaSignatureVerificationResponse,
  P2pkhTraceRequest,
  P2pkhTraceResponse,
  P2wpkhTraceResponse,
  TransactionContextResponse,
  TransactionExamplesResponse,
} from './trace-api.models';

@Injectable({ providedIn: 'root' })
export class TraceApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = getRuntimeConfig().apiBaseUrl.replace(/\/$/, '');

  loadP2pkhTrace(request: P2pkhTraceRequest): Observable<P2pkhTraceResponse> {
    return this.http.post<P2pkhTraceResponse>(`${this.apiBaseUrl}/api/v1/traces/p2pkh`, request);
  }

  loadP2wpkhTrace(request: P2pkhTraceRequest): Observable<P2wpkhTraceResponse> {
    return this.http.post<P2wpkhTraceResponse>(`${this.apiBaseUrl}/api/v1/traces/p2wpkh`, request);
  }

  verifyEcdsaSignature(
    request: EcdsaSignatureVerificationRequest,
  ): Observable<EcdsaSignatureVerificationResponse> {
    return this.http.post<EcdsaSignatureVerificationResponse>(
      `${this.apiBaseUrl}/api/v1/signatures/ecdsa/verify`,
      request,
    );
  }

  loadTransactionContext(txid: string): Observable<TransactionContextResponse> {
    return this.http.get<TransactionContextResponse>(
      `${this.apiBaseUrl}/api/v1/transactions/${txid}/context`,
    );
  }

  loadTransactionExamples(): Observable<TransactionExamplesResponse> {
    return this.http.get<TransactionExamplesResponse>(
      `${this.apiBaseUrl}/api/v1/transactions/examples`,
    );
  }
}
