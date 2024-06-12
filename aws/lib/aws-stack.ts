import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Sqs } from './aws-sqs';

export class AwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new Sqs(this, "deployment");
  }
}
