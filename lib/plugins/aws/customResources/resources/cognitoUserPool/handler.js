'use strict';

const { addPermission, removePermission, updatePermission } = require('./lib/permissions');
const { updateConfiguration, removeConfiguration, findUserPoolByName } = require('./lib/userPool');
const { getEnvironment, getLambdaArn, handlerWrapper } = require('../utils');

async function handler(event, context) {
  if (event.RequestType === 'Create') {
    return create(event, context);
  } else if (event.RequestType === 'Update') {
    return update(event, context);
  } else if (event.RequestType === 'Delete') {
    return remove(event, context);
  }
  throw new Error(`Unhandled RequestType ${event.RequestType}`);
}

async function create(event, context) {
  const { FunctionName, FunctionVersion, UserPoolName, UserPoolConfigs } = event.ResourceProperties;
  const { Partition, Region, AccountId } = getEnvironment(context);

  const lambdaArn = getLambdaArn(Partition, Region, AccountId, FunctionName, FunctionVersion);

  return findUserPoolByName({ userPoolName: UserPoolName, region: Region }).then((userPool) =>
    addPermission({
      functionName: FunctionName,
      functionArn: lambdaArn,
      userPoolName: UserPoolName,
      partition: Partition,
      region: Region,
      accountId: AccountId,
      userPoolId: userPool.Id,
    }).then(() =>
      updateConfiguration({
        lambdaArn,
        userPoolName: UserPoolName,
        userPoolConfigs: UserPoolConfigs,
        region: Region,
      })
    )
  );
}

async function update(event, context) {
  const { Partition, Region, AccountId } = getEnvironment(context);
  const { FunctionName, FunctionVersion, UserPoolName, UserPoolConfigs } = event.ResourceProperties;

  const lambdaArn = getLambdaArn(Partition, Region, AccountId, FunctionName, FunctionVersion);

  return findUserPoolByName({ userPoolName: UserPoolName, region: Region }).then((userPool) =>
    updatePermission({
      functionName: FunctionName,
      functionArn: lambdaArn,
      userPoolName: UserPoolName,
      partition: Partition,
      region: Region,
      accountId: AccountId,
      userPoolId: userPool.Id,
    }).then(() =>
      updateConfiguration({
        lambdaArn,
        userPoolName: UserPoolName,
        userPoolConfigs: UserPoolConfigs,
        region: Region,
      })
    )
  );
}

async function remove(event, context) {
  const { Partition, Region, AccountId } = getEnvironment(context);
  const { FunctionName, FunctionVersion, UserPoolName } = event.ResourceProperties;

  const lambdaArn = getLambdaArn(Partition, Region, AccountId, FunctionName, FunctionVersion);

  return removePermission({
    functionName: FunctionName,
    userPoolName: UserPoolName,
    region: Region,
  }).then(() =>
    removeConfiguration({
      lambdaArn,
      userPoolName: UserPoolName,
      region: Region,
    })
  );
}

module.exports = {
  handler: handlerWrapper(handler, 'CustomResourceExistingCognitoUserPool'),
};