import { HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Callback, Context, Handler, S3Event } from 'aws-lambda';
import { Invoiceodule } from './invoice.module';
import { AppService } from './app.service';
import {
  TextractClient,
  DetectDocumentTextCommand,
} from '@aws-sdk/client-textract';

export const handler: Handler = async (
  event: S3Event,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(Invoiceodule);
  const appService = appContext.get(AppService);

  const textractClient = new TextractClient();

  textractClient.send(
    new DetectDocumentTextCommand({
      Document: '',
    }),
  );

  return {
    body: appService.getHello(),
    statusCode: HttpStatus.OK,
  };
};
