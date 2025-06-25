import { GetDocumentTextDetectionCommand } from "@aws-sdk/client-textract";
import { AWSClients } from '../common';

const textract = AWSClients.textract();

const getTextDetectionResults = async (event, nextToken = null) => {
    const { jobId } = event.textDetection;
    const params = {
        JobId: jobId,
        MaxResults: 1000,
    };
    if (nextToken) {
        params.NextToken = nextToken;
    }
    const data = await textract.send(new GetDocumentTextDetectionCommand(params));
    let textOutput = '';

    if (data.JobStatus === 'SUCCEEDED') {
        const lineBlocks = data.Blocks.filter(b => b.BlockType === 'WORD');
        const textFromLineBlocks = lineBlocks.map(b => b.Text);
        textOutput = textFromLineBlocks.join(' ').trim();

        if (data.NextToken) {
            // Delay 1 second to avoid exceeding provisioned rate for Textract
            await new Promise(r => setTimeout(r, 1000));
            const { outputText: nextText } = await getTextDetectionResults(event, data.NextToken);
            if (nextText) {
                textOutput += ` ${nextText}`;
            }
        }
    } else if (data.JobStatus === 'FAILED') {
        throw new Error('Could not detect text from document');
    }

    return {
        jobId,
        jobStatus: data.JobStatus,
        textOutput,
    };
};

exports.handler = async event => {
    const { jobId } = event.textDetection;
    console.info(`Getting text detection results. JOB ID: ${jobId}`);
    const results = await getTextDetectionResults(event);
    return {
        ...event,
        textDetection: results,
    };
};