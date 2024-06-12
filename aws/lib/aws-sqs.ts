import { Construct } from "constructs";
import { CfnOutput, RemovalPolicy, aws_cloudfront, aws_iam } from "aws-cdk-lib";
import { Distribution, PriceClass, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";

export class Sqs extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.init();
  }

  private init(): void {
    const bucket = this.createBucket();
    const distribution = this.createDistribution(bucket);

    this.deployBucket(bucket, distribution);
    this.createCloudFrontDistribution(bucket, distribution);
  }

  private createBucket(): Bucket {
    const oai = new aws_cloudfront.OriginAccessIdentity(this, 'CloudFront.OriginAccessIdentity');
    const bucket = new Bucket(this, "shopReactBucket", {
      versioned: true,
      autoDeleteObjects: true,
      bucketName: "aws-shop-react-rs-cdk",
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    bucket.addToResourcePolicy(new aws_iam.PolicyStatement({
      actions:["S3:GetObject"],
      resources: [bucket.arnForObjects("*")],
      principals: [new aws_iam.CanonicalUserPrincipal(oai.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
    }))

    return bucket;
  }

  private createDistribution(bucket: Bucket): Distribution {
    return new Distribution(this, "ShopReactDistribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: new S3Origin(bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      priceClass: PriceClass.PRICE_CLASS_100,
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
    });
  }

  private deployBucket(bucket: Bucket, distribution: Distribution): void {
    new BucketDeployment(this, "BucketDeployment", {
      distribution,
      destinationBucket: bucket,
      distributionPaths: ["/*"],
      sources: [Source.asset('../dist')],
    });
  }

  private createCloudFrontDistribution(bucket: Bucket, distribution: Distribution): void {
      new CfnOutput(this, "CloudFrontURL", {
      value: distribution.domainName,
      description: "The distribution URL",
      exportName: "CloudfrontURL",
    });

    new CfnOutput(this, "BucketName", {
      value: bucket.bucketName,
      description: "The name of the S3 bucket",
      exportName: "BucketName",
    });
  }
}