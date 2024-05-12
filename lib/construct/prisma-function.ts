import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export interface DatabaseConnectionProps {
  host: string;
  port: string;
  engine: string;
  username: string;
  password: string;
}

interface PrismaFunctionProps extends lambda.DockerImageFunctionProps {
  database: DatabaseConnectionProps;
}

export class PrismaFunction extends lambda.DockerImageFunction {
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
    });
  }
}