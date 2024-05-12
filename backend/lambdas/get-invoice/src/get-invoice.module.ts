import { Module } from '@nestjs/common';
import { InvoiceModule } from '../../../libs/invoice/src';

@Module({
  imports: [InvoiceModule],
  providers: [],
})
export class GetInvoiceModule {}
