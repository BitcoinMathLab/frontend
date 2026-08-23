import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-signature-detail',
  templateUrl: './signature-detail.html',
  styleUrl: './signature-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignatureDetail {
  readonly signature = input.required<string>();
  readonly publicKey = input.required<string>();
  readonly close = output<void>();
}
