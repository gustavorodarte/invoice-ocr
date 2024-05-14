import { Code, LayerVersion, Runtime } from "aws-cdk-lib/aws-lambda";
import * as path from 'path';



const prismaLayer = new LayerVersion(this, 'PrismaLayer', {
    compatibleRuntimes: [Runtime.NODEJS_16_X],
    description: 'Prisma Layer',
    code: Code.fromAsset(path.join(__dirname, '../../dist/layers'), {
      bundling: {
        image: Runtime.NODEJS_16_X.bundlingImage,
        command: [
          'bash',
          '-c',
          [
            'cp package.json package-lock.json api.js client.js /asset-output',
            'cp -r prisma /asset-output/prisma',
            'cp -r node_modules /asset-output/node_modules',
            'rm -rf /asset-output/node_modules/.cache',
            'rm -rf /asset-output/node_modules/@prisma/engines/node_modules',,
            'npx prisma generate',
          ].join(' && '),
        ],
      },
    }),
    layerVersionName: `prisma-layer`,
  })