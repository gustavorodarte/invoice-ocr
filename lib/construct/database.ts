import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

interface DatabaseProps {
  vpc: ec2.IVpc;
}

export class Database extends Construct {
  readonly cluster: rds.DatabaseCluster;
  readonly secret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    const vpc = props.vpc;

    const engine = rds.DatabaseClusterEngine.auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_15_2 });
    const cluster = new rds.DatabaseCluster(this, "Cluster", {
      engine,
      serverlessV2MaxCapacity: 1,
      serverlessV2MinCapacity: 0.5,
      writer: rds.ClusterInstance.serverlessV2("Writer", {
        enablePerformanceInsights: true,
        caCertificate: rds.CaCertificate.RDS_CA_ECC384_G1,
      }),
      vpc,
      vpcSubnets: vpc.selectSubnets({ subnets: vpc.isolatedSubnets.concat(vpc.privateSubnets) }),
      storageEncrypted: true,
      // Exclude some more special characters from password string to avoid from URI encoding issue
      // see: https://www.prisma.io/docs/orm/reference/connection-urls#special-characters
      credentials: rds.Credentials.fromUsername(engine.defaultUsername ?? "admin", {
        excludeCharacters: " %+~`#$&*()|[]{}:;<>?!'/@\"\\,=^",
      }),
    });

    this.cluster = cluster;
    this.secret = cluster.secret!;
  }

  allowInboundAccess(peer: ec2.IPeer) {
    this.cluster.connections.allowDefaultPortFrom(peer);
  }
}