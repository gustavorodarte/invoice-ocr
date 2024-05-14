import { Module } from '@nestjs/common';
import { InvoiceModule } from '../../../layers/invoice/src';

@Module({
  imports: [InvoiceModule],
  providers: [],
})
export class InvoiceOcrModule {}
