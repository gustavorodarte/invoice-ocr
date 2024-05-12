import { HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Handler } from 'aws-lambda';
import { Invoiceodule } from './invoice.module';
import { InvoiceService } from './invoice.service';

export const handler: Handler = async () => {
  const appContext = await NestFactory.createApplicationContext(Invoiceodule);
  const invoiceService = appContext.get(InvoiceService);

  const invoices = await invoiceService.invoices({});

  return {
    body: invoices,
    statusCode: HttpStatus.OK,
  };
};
