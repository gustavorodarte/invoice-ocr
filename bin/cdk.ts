#!/usr/bin/env node
import "source-map-support/register";
import { App } from 'aws-cdk-lib';
import { InvoiceOcrCdkStack } from "../lib/stack/invoice-ocr-cdk-stack";

const app = new App();
new InvoiceOcrCdkStack(app, "InvoiceOcrCdkStack");