import * as fs from 'fs';

// Function to append data to a file
export async function appendToFile(filePath: string, data: string): Promise<void> {
    
    const dataAndNewLine: string = data + '\n';

    fs.appendFile(filePath, dataAndNewLine, (err) => {
        if (err) {
            console.error('Error appending data to file:', err);
        } else {
            // console.log('Data appended to file successfully');
        }
    });
}

export async function overwriteFile(filePath: string, data: string[]): Promise<void> {

    const flatData = data.join('\n');
    fs.writeFileSync(filePath, flatData, 'utf-8');
}