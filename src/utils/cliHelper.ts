import { exec } from "child_process";


export const runCommand = (sfdxCommand:string):Promise<any> => {
      console.log('✅ Running command : ' + sfdxCommand);
      
      return new Promise((resolve, reject) => {
        exec(sfdxCommand, { maxBuffer: 0.8 * 1024 * 1024 }, (error, stdout, stderr) => {
          if (error) {
              console.error(`exec error: ${error}`);
              reject(error);
          }
        console.log(`stdout: ${stdout}`);
        resolve(stdout || stderr);
      });
    });
};

