import { Code, Function, FunctionProps, Runtime } from "aws-cdk-lib/aws-lambda";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export interface DatabaseConnectionProps {
  host: string;
  port: string;
  engine: string;
  username: string;
  password: string;
}

interface PrismaFunctionProps extends FunctionProps {
  database: DatabaseConnectionProps;
  code: Code,
}

export class PrismaFunction extends Function {
  constructor(scope: Construct, id: string, props: PrismaFunctionProps) {
    super(scope, id, {
      ...props,
      environment: {
        ...props.environment,
        DATABASE_HOST: props.database.host,
        DATABASE_PORT: props.database.port,
        DATABASE_ENGINE: props.database.engine,
        DATABASE_USER: props.database.username,
        DATABASE_PASSWORD: props.database.password,
      },
      code: props.code,
    });
  }
}