import {
  Stack,
  StackProps,
  Duration,
  Aws,
  aws_iam as iam,
  aws_s3 as s3,
  aws_lambda as lambda,
  aws_s3objectlambda as s3ObjectLambda,
  aws_rds as rds,
  aws_ec2 as ec2,
} from 'aws-cdk-lib';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

import { LambdaIntegration, MethodLoggingLevel, RestApi } from "aws-cdk-lib/aws-apigateway"
import { Construct } from 'constructs';
import { Function, Runtime, AssetCode, Code } from "aws-cdk-lib/aws-lambda"
import * as lambdaEvents from 'aws-cdk-lib/aws-lambda-event-sources';

interface LambdaStackProps extends StackProps {
  functionName: string;
  dbName: string;
  auroraClusterUsername: string;
}

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: LambdaStackProps) {
    super(scope, id, props);

    // Set up a bucket
    const bucket = new s3.Bucket(this, 'paggo-ocr', {
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    bucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['*'],
      principals: [new iam.AnyPrincipal()],
      resources: [
        bucket.bucketArn,
        bucket.arnForObjects('*')
      ],
      conditions: {
        'StringEquals':
        {
          's3:DataAccessPointAccount': `${Aws.ACCOUNT_ID}`
        }
      }
    }
    ));

    // Set up ocr lambda
    const ocrLambdaFunction = new Function(this, props.functionName, {
      functionName: props.functionName,
      handler: "handler.handler",
      runtime: Runtime.NODEJS_20_X,
      code: new AssetCode(`./src`),
      memorySize: 512,
      timeout: Duration.seconds(10),
    })

    const invokeEventSource = new lambdaEvents.S3EventSource(bucket, {
      events: [s3.EventType.OBJECT_CREATED],
    });


    const getInvoceLambdaFunction = new Function(this, props.functionName, {
      functionName: props.functionName,
      handler: "handler.handler",
      runtime: Runtime.NODEJS_20_X,
      code: new AssetCode(`./src`),
      memorySize: 512,
      timeout: Duration.seconds(10),
    })

    // Set up api gateway
    const restApi = new RestApi(this, this.stackName + "RestApi", {
      deployOptions: {
        stageName: "beta",
        metricsEnabled: true,
        loggingLevel: MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
    })


    restApi.root.addMethod("GET", new LambdaIntegration(getInvoceLambdaFunction, {}));

    ocrLambdaFunction.addEventSource(invokeEventSource)

    const auroraClusterSecret = new Secret(
      this,
      'AuroraClusterCredentials',
      {
        secretName: props.dbName + 'AuroraClusterCredentials',
        description: props.dbName + 'AuroraClusterCrendetials',
        generateSecretString: {
          excludeCharacters: "\"@/\\ '",
          generateStringKey: 'password',
          passwordLength: 30,
          secretStringTemplate: JSON.stringify({ username: props.auroraClusterUsername }),
        },
      },
    );

    const auroraClusterCrendentials = rds.Credentials.fromSecret(
      auroraClusterSecret,
      props.auroraClusterUsername,
    );

    const cluster = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      serverlessV2MaxCapacity: 1,
      serverlessV2MinCapacity: 0.5,
      credentials: auroraClusterCrendentials,
    });
  }
}
