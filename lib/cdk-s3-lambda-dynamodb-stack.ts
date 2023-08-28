import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class CdkS3LambdaDynamodbStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const incomingBucket = new s3.Bucket(this, 'IncomingBucket', {
        bucketName: "fwd-excel-file-upload-08222023",
    });

    const fileProcessingLambda = new lambda.Function(this, 'FileProcessingLambda', {
        functionName:  'FileProcessingLambda',
        runtime: lambda.Runtime.NODEJS_16_X,
        code: lambda.Code.fromAsset('lambda'),
        timeout:  cdk.Duration.seconds(300),
        handler: 'file_processing.handler',
    });

    const BookCatalogueTable = new dynamodb.Table(this, 'BookCatalogue', {
        tableName: 'BookCatalogue',
        partitionKey: {
            name: 'book_id',
            type: dynamodb.AttributeType.STRING,
        }
    });

    incomingBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(fileProcessingLambda));
    incomingBucket.grantRead(fileProcessingLambda);

    BookCatalogueTable.grantReadWriteData(fileProcessingLambda);
  }
}
