import { exec } from 'child_process';
import * as path from 'path';
import { promises as fs } from 'fs';
import { existsSync, statSync } from 'fs';
import { promisify } from 'util';
import { AWSClients } from '../common';
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const execCommand = promisify(exec);
const s3 = AWSClients.s3();

const getCommand = (inputFile, outputFile) => {
    /*let command = `/opt/bin/gs`;
    command += ` -sDEVICE=png16m`;
    command += ` -dPDFFitPage=true`;
    command += ` -sPageList=1`;
    command += ` -sPAPERSIZE=a4`;
    command += ` -r150`;
    command += ` -o ${outputFile} ${inputFile}`;
    return command;*/

    return `/opt/bin/gs -q -dNOPAUSE -dBATCH -sDEVICE=png16m -sOutputFile=${outputFile} ${inputFile}`
};

exports.handler = async event => {
    const timestamp = new Date().getTime();
    const inputFile = path.resolve('/tmp', `${timestamp}-input.pdf`);
    const outputFile = path.resolve('/tmp', `${timestamp}-output.png`);

    const getObjectParams = {
        Key: event.file.key,
        Bucket: event.file.bucket
    };

    const data = await s3.send(new GetObjectCommand(getObjectParams));
    await fs.writeFile(inputFile, data.Body);

    if (!existsSync(inputFile)) {
        throw new Error('Input PDF does not exist.');
    }

    const stats = statSync(inputFile);
    console.log('PDF size:', stats.size);

    const fontPath = process.env.GS_FONTPATH;
    if (existsSync(fontPath)) {
        const stats = statSync(fontPath);

        console.log('✅ Font path exists.');
        console.log('📄 Is directory:', stats.isDirectory());
        console.log('🔐 Permissions:', (stats.mode & 0o777).toString(8));

        fs.readdir(fontPath).then(files => {
            console.log('📁 Font files:', files);
        }).catch(err => {
            console.error('🚫 Failed to list fonts:', err);
        });
    } else {
        console.error(`🚫 Font path does not exist at ${process.env.GS_FONTPATH}`);
    }

    await fs.copyFile(inputFile, inputFile + '.bak');

    await execCommand(`/opt/bin/gs --version`);
    await execCommand(getCommand(inputFile, outputFile));

    if (existsSync(outputFile)) {
        const stats = statSync(outputFile);
        console.log('🖼️ PNG created at', outputFile, 'Size:', stats.size);
    } else {
        console.error('❌ Ghostscript did not produce an output file.');
    }

    const thumbnailName = `${path.basename(event.file.key, '.pdf')}-thumb.png`;

    const putObjectParams = {
        Key: thumbnailName,
        Bucket: process.env.ASSET_BUCKET,
        Body: await fs.readFile(outputFile)
    };

    await s3.send(new PutObjectCommand(putObjectParams));

    const output = {
        thumbnail: {
            key: thumbnailName,
            bucket: process.env.ASSET_BUCKET,
        },
    };

    return {
        ...output,
        ...event,
    };
};