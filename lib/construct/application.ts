import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3"
import * as iam from "aws-cdk-lib/aws-iam"
import { DatabaseConnectionProps, PrismaFunction } from "./prisma-function";
import { Construct } from "constructs";
import { Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { LambdaIntegration, MethodLoggingLevel, RestApi } from "aws-cdk-lib/aws-apigateway"
import { HttpMethods } from "aws-cdk-lib/aws-s3";


interface ApplicationProps {
    vpc: ec2.IVpc;
    database: DatabaseConnectionProps;
}

export class Application extends Construct {
    readonly lambdaSecurityGroup: ec2.ISecurityGroup;
    readonly migrationHandler: Function;

    constructor(scope: Construct, id: string, props: ApplicationProps) {
        super(scope, id);

        const { vpc, database } = props;

        const securityGroup = new ec2.SecurityGroup(this, `SecurityGroup`, {
            vpc: props.vpc,
        });

        const ocrLambdaFunction = new PrismaFunction(this, "InvoiceOcr", {
            entry: "./backend/dist/invoice/invoice-ocr.handler.js",
            memorySize: 256,
            runtime: Runtime.NODEJS_20_X,
            timeout: cdk.Duration.seconds(15),
            vpc,
            securityGroups: [securityGroup],
            database,
            depsLockFilePath: "./backend/yarn.lock",
        });

        const getInvoceLambdaFunction = new PrismaFunction(this, "GetInvoices", {
            entry: "./backend/dist/invoice/get-invoice.handler.js",
            memorySize: 256,
            runtime: Runtime.NODEJS_20_X,
            timeout: cdk.Duration.seconds(15),
            vpc,
            securityGroups: [securityGroup],
            database,
            depsLockFilePath: "./backend/yarn.lock",
        });

        const migrationRunner = new PrismaFunction(this, "MigrationRunner", {
            entry: "./backend/dist/migration/migration-runner.handler.js",
            memorySize: 256,
            runtime: Runtime.NODEJS_20_X,
            timeout: cdk.Duration.seconds(15),
            vpc,
            securityGroups: [securityGroup],
            database,
            depsLockFilePath: "./backend/yarn.lock",
        });

        const bucket = new s3.Bucket(this, 'invoice-ocr', {
            accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            publicReadAccess: true,
            cors: [
                {
                    "allowedHeaders": [
                        "*"
                    ],
                    "allowedMethods": [
                        HttpMethods.GET,
                        HttpMethods.PUT,
                        HttpMethods.POST,
                        HttpMethods.DELETE,
                    ],
                    "allowedOrigins": [
                        "*"
                    ],
                    "exposedHeaders": []
                }
            ],
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
                    's3:DataAccessPointAccount': `${cdk.Aws.ACCOUNT_ID}`
                }
            }
        }
        ));

        const invokeEventSource = new cdk.aws_lambda_event_sources.S3EventSource(bucket, {
            events: [s3.EventType.OBJECT_CREATED],
        });

        ocrLambdaFunction.addEventSource(invokeEventSource)

        const restApi = new RestApi(this, "InvoicesRestApi", {
            deployOptions: {
                stageName: "dev",
                metricsEnabled: true,
                loggingLevel: MethodLoggingLevel.INFO,
                dataTraceEnabled: true,
            },
        })

        restApi.root.addMethod("GET", new LambdaIntegration(getInvoceLambdaFunction, {}));

        new cdk.CfnOutput(this, `OcrLambdaLambdaArn`, { value: ocrLambdaFunction.functionArn });
        new cdk.CfnOutput(this, `MigrationRunnerLambdaArn`, { value: migrationRunner.functionArn });
        new cdk.CfnOutput(this, `GetInvoiceLambdaArn`, { value: getInvoceLambdaFunction.functionArn });
        
    
        this.migrationHandler = migrationRunner;;
        this.lambdaSecurityGroup = securityGroup;
    }
}