import * as path from 'path';
import { PDFDocument } from 'pdf-lib';
import { AWSClients } from '../common';
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = AWSClients.s3();

const getMetadataFromDocument = doc => {
    return {
        author: doc.getAuthor(),
        createdDate: doc.getCreationDate(),
        modifiedDate: doc.getModificationDate(),
        pageCount: doc.getPageCount(),
        title: doc.getTitle(),
        keywords: doc.getKeywords(),
    };
};

const streamToBuffer = (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

exports.handler = async event => {
    if (event.source !== 'aws.s3') {
        throw new Error('Invalid source event');
    }

    const extension = path.extname(event.detail.requestParameters.key);

    if (extension.toLowerCase() !== '.pdf') {
        throw new Error('Unsupported file type');
    }

    const getObjectParams = {
        Key: event.detail.requestParameters.key,
        Bucket: event.detail.requestParameters.bucketName
    };

    const data = await s3.send(new GetObjectCommand(getObjectParams));

    const buffer = await streamToBuffer(data.Body);

    const metadataParams = {
        updateMetadata: false
    };
    const document = await PDFDocument.load(buffer, metadataParams);

    const metadata = getMetadataFromDocument(document);

    const putObjectParams = {
        Key: event.detail.requestParameters.key,
        Bucket: process.env.ASSET_BUCKET,
        Body: buffer,
        ContentType: data.ContentType,
        ContentLength: buffer.length
    };

    await s3.send(new PutObjectCommand(putObjectParams));

    return {
        file: {
            key: event.detail.requestParameters.key,
            bucket: event.detail.requestParameters.bucketName,
            size: buffer.length
        },
        metadata
    };
};