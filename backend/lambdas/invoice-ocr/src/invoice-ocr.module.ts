import { Module } from '@nestjs/common';
import { InvoiceModule } from '/opt/invoice';

@Module({
  imports: [InvoiceModule],
  providers: [],
})
export class InvoiceOcrModule {}
