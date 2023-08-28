const aws = require('aws-sdk');
const { parse }  = require('csv-parse');

const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const ddb = new aws.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    // Get the object from the event and show its content type
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const params = {
        Bucket: bucket,
        Key: key,
    };

    const parser = parse({
        delimiter: ',',
        from_line: 2,
    });

    // Use the readable stream api to consume records
    parser.on('readable', function(){
      let record;
      while ((record = parser.read()) !== null) {
        var params = {
            TableName: 'BookCatalogue',
            Item: {
                book_id: record[0],
                title: record[1],
                author: record[2],
                edition: record[3],
                reviews: record[4],
                ratings: record[5],
                synopsis: record[6],
            }
        };
        ddb.put(params).promise().then(data => {
            console.log(params);
        }).catch(err => {
            console.error(err);
        });
      }
    });

    // Catch any error
    parser.on('error', function(err){
      console.error(err.message);
    });

    return new Promise((resolve, reject) => {
        s3.getObject(params).createReadStream().pipe(parser);
    });
};
