#!/usr/bin/env node
import "source-map-support/register";
import { App } from 'aws-cdk-lib';
import { InvoiceOcrCdkStack } from "../lib/stack/invoice-ocr-cdk-stack";
import { CdkGraph } from "@aws/pdk/cdk-graph";


const app = new App();
new InvoiceOcrCdkStack(app, "InvoiceOcrCdkStack3");


new CdkGraph(app);