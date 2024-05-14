import { NestFactory } from '@nestjs/core';
import { Handler, S3Event } from 'aws-lambda';
import { InvoiceOcrModule } from './invoice-ocr.module';
import { InvoiceService } from '../../../layers/invoice/src';
import {
  TextractClient,
  DetectDocumentTextCommand,
} from '@aws-sdk/client-textract';

export const handler: Handler = async (event: S3Event) => {
  const appContext =
    await NestFactory.createApplicationContext(InvoiceOcrModule);
  const invoiceService = appContext.get(InvoiceService);

  const textractClient = new TextractClient();

  const { Blocks: blocks } = await textractClient.send(
    new DetectDocumentTextCommand({
      Document: {
        S3Object: {
          Bucket: event.Records[0].s3.bucket.name,
          Name: event.Records[0].s3.object.key,
        },
      },
    }),
  );

  const textLines =
    blocks
      ?.filter((block) => block.BlockType === 'LINE')
      .map((block) => block.Text) || {};

  await invoiceService.createInvoice({
    title: 'titulo',
    content: textLines,
  });
};
