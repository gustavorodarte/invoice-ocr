import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3"
import * as iam from "aws-cdk-lib/aws-iam"
import { DatabaseConnectionProps, PrismaFunction } from "./prisma-function";
import { Construct } from "constructs";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { LambdaIntegration, MethodLoggingLevel, RestApi } from "aws-cdk-lib/aws-apigateway"
import { HttpMethods } from "aws-cdk-lib/aws-s3";
import { LayerVersion } from "aws-cdk-lib/aws-lambda";

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

         const prismaLayer = new LayerVersion(this, 'PrismaLayer', {
            compatibleRuntimes: [Runtime.NODEJS_20_X],
            description: 'Prisma Layer',
            code: Code.fromAsset('backend/dist/layers/prisma'),
            layerVersionName: `prisma-layer`,
          });
    
          const invoceLayer = new LayerVersion(this, 'InvoiceLayer', {
            compatibleRuntimes: [Runtime.NODEJS_20_X],
            description: 'Invoice Layer',
            code: Code.fromAsset('backend/dist/layers/invoice'),
            layerVersionName: `invoice-layer`,
          });


        const ocrLambdaFunction = new PrismaFunction(this, "InvoiceOcr", {
            code: Code.fromAsset("backend/dist/lambdas/invoice-ocr"),
            memorySize: 256,
            runtime: Runtime.NODEJS_20_X,
            timeout: cdk.Duration.seconds(15),
            vpc,
            securityGroups: [securityGroup],
            database,
            handler: "main.handler",
            layers: [prismaLayer, invoceLayer],
        });

        const getInvoceLambdaFunction = new PrismaFunction(this, "GetInvoices", {
            code: Code.fromAsset("backend/dist/lambdas/get-invoice"),
            memorySize: 256,
            runtime: Runtime.NODEJS_20_X,
            timeout: cdk.Duration.seconds(15),
            vpc,
            securityGroups: [securityGroup],
            database,
            handler: "main.handler",
            layers: [prismaLayer, invoceLayer],
        });

        const migrationRunner = new PrismaFunction(this, "MigrationRunner", {
            code: Code.fromAsset("lib/lambda"),
            memorySize: 256,
            runtime: Runtime.NODEJS_20_X,
            timeout: cdk.Duration.seconds(15),
            vpc,
            securityGroups: [securityGroup],
            database,
            handler: "migration.handler",
        });

        const bucket = new s3.Bucket(this, 'invoice-ocr', {
            publicReadAccess: true,
            blockPublicAccess: {
                blockPublicAcls: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: false,
                blockPublicPolicy: false,
            },
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

        bucket.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: ['s3:GetObject'],
                effect: iam.Effect.ALLOW,
                principals: [new iam.StarPrincipal()],
                resources: [bucket.arnForObjects('*')],
            })
        )


        const invokeEventSource = new cdk.aws_lambda_event_sources.S3EventSource(bucket, {
            events: [s3.EventType.OBJECT_CREATED],
        });

        ocrLambdaFunction.addEventSource(invokeEventSource);

        // const logGroupName = "apigateway-invoice-lambda";
        // const logRetention = new cdk.aws_logs.LogRetention(
        //     scope,
        //     "apiGwLogGroupConstruct",
        //     {
        //         logGroupName: logGroupName,
        //         retention: cdk.aws_logs.RetentionDays.ONE_WEEK,
        //         removalPolicy: cdk.RemovalPolicy.DESTROY,
        //     }
        // );
        // const logGroup = cdk.aws_logs.LogGroup.fromLogGroupArn(
        //     scope,
        //     "apiGwLogGroup",
        //     logRetention.logGroupArn
        // );

        const restApi = new RestApi(this, "InvoicesRestApi", {
            deployOptions: {
                stageName: "dev",
                metricsEnabled: true,
                // loggingLevel: MethodLoggingLevel.INFO,
                dataTraceEnabled: true,
                // accessLogDestination: new cdk.aws_apigateway.LogGroupLogDestination(
                //     logGroup
                // ),
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