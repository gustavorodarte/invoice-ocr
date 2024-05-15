#!/usr/bin/env node
import "source-map-support/register";
import { App } from 'aws-cdk-lib';
import { InvoiceOcrCdkStack } from "../lib/stack/invoice-ocr-cdk-stack";
import { CdkGraph, FilterPreset, Filters } from "@aws/pdk/cdk-graph";
import { CdkGraphDiagramPlugin } from "@aws/pdk/cdk-graph-plugin-diagram";

(async () => {
    const app = new App();
    new InvoiceOcrCdkStack(app, "InvoiceOcrCdkStack3");
    const graph = new CdkGraph(app, {
        plugins: [new CdkGraphDiagramPlugin({
            defaults: {
                theme: "dark",
                filterPlan: {
                    preset: FilterPreset.COMPACT,
                },
            },
        })],
    });

    app.synth();
    await graph.report();
})();



