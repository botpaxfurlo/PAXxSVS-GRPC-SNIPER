import { exec } from 'child_process';

// Function to open a URL in a new browser tab
export function openURL(url: string) {
  // The command to open a URL in the default browser
  const command = `ssh -X twizzler@172.28.22.44 'open ${url}'`;

  // Execute the command
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error opening URL: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
}