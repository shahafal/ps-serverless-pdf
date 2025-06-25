import { StartDocumentTextDetectionCommand } from "@aws-sdk/client-textract";
import { AWSClients } from '../common';

const textract = AWSClients.textract();

exports.handler = async event => {
    const textDetectionParams = {
        DocumentLocation: {
            S3Object: {
                Bucket: event.file.bucket,
                Name: event.file.key,
            },
        },
    };
    const data = await textract.send(new StartDocumentTextDetectionCommand(textDetectionParams));
    const output = {
        textDetection: {
            jobId: data.JobId,
        },
    };
    return {
        ...event,
        ...output,
    };
};