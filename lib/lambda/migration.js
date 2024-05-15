const runner = require('node-pg-migrate');


const getDbonectionString = async () => {
  return `postgres://${process.env.username}:${process.env.password}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}`;
};


const handler = async (
  event,
  context,
) => {
  const resp = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: context.logGroupName,
  };

  if (event.RequestType == 'Delete') {
    return {
      ...resp,
      Status: 'SUCCESS',
      Data: { Result: 'None' },
    };
  }

  try {
    const connectionString = await getDbonectionString();

    const migrationResult = await runner({
      databaseUrl: connectionString,
      migrationsTable: 'migration-table',
      dir: `${__dirname}/migrations`,
      direction: 'up',
      verbose: true,
    });

    const nbOfExecutedScripts = migrationResult.length;

    return {
      ...resp,
      Status: 'SUCCESS',
      Data: { Result: nbOfExecutedScripts },
    };
  } catch (error) {
    if (error instanceof Error) {
      resp.Reason = error.message;
    }
    return {
      ...resp,
      Status: 'FAILED',
      Data: { Result: error },
    };
  }
};

exports.handler = handler;
