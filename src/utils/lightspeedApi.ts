import axios from 'axios';
/* eslint-disable @typescript-eslint/naming-convention */
// const AI_HOST = 'http://0.0.0.0:8000';
const AI_HOST = 'https://lightspeed-metadata-api-09727b0f8907.herokuapp.com';

// Generate Initial Metadata Plan - API 1
export async function generateConfigPlan(prompt:string, llmkey:string) {
    //
    const endpoint = `${AI_HOST}/generate-metadata-config-plan?requirements_prompt=${prompt}&llmkey=${llmkey}`;
   try {
    const response = await axios.post(endpoint);
      return response;
   } catch (error) {
        throw new Error('unable to get config ' + JSON.stringify(error));
   }
}
// Generate DEPEDENCY PLAN API 2
export async function analyseMetadataDependencies(requirements:any, filePaths:string, llmkey:string) {
    const endpoint = `${AI_HOST}/analyze-salesforce-metadata-dependencies/?llmkey=${llmkey}`;
    ///?requirements_prompt=${requirements}&file_paths=${filePaths}
    try {
        const response = await axios.post(endpoint, {
            "requirements_prompt": requirements,
            "file_paths": filePaths
        });
        
        return response;
    } catch (e) {
        // return e;
        throw new Error('unable to get metadata deps: ' + JSON.stringify(e));
    }
}
/*
 * Generate Metadata - API 3
 */
export async function generateMetadata(prompt:string, filename:string, filePaths:string, depsAnalysis:string, llmkey:string) {
    const endpoint = `${AI_HOST}/generate-metadata/?prompt=${prompt}&filename=${filename}&file_paths=${filePaths}&deps_analysis=${depsAnalysis}&llmkey=${llmkey}`;

    // const req = {
    //     "filename": filename,
    //     "file_paths": file_paths,
    //     "deps_analysis":deps_analysis,
    //     "prompt":prompt
    // }

    try {
        const response = await axios.post(endpoint);
        return response;
    } catch (e) {
        throw new Error('unable to generate code: ' + JSON.stringify(e));
    }
}