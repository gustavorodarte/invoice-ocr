import { HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Handler } from 'aws-lambda';
import { GetInvoiceModule } from './get-invoice.module';
import { InvoiceService } from '../../../libs/invoice/src';

export const handler: Handler = async () => {
  const appContext =
    await NestFactory.createApplicationContext(GetInvoiceModule);
  const invoiceService = appContext.get(InvoiceService);

  const invoices = await invoiceService.invoices({});

  return {
    body: invoices,
    statusCode: HttpStatus.OK,
  };
};
