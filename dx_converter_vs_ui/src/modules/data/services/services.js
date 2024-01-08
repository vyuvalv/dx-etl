const HOST = 'http://0.0.0.0:8000';
const SERVER = 'http://localhost:3001';
/*
 * GET Files From Local Server
 */
export async function getFiles() { 
    const endpoint = `${SERVER}/api/v1/file`;
    try {
        const response = await fetch(endpoint);
        return response.json();
    } catch (e) {
        return e;
    }
}

export async function getDefaultOrgs() { 
    const endpoint = `${SERVER}/api/v1/config`;
    try {
        const response = await fetch(endpoint);
        return response.json();
    } catch (e) {
        return e;
    }
}

export async function getOrgs() { 
    const endpoint = `${SERVER}/api/v1/orgs`;
    try {
        const response = await fetch(endpoint);
        return response.json();
    } catch (e) {
        return e;
    }
}

export async function manageOrg(method='create', orgAlias='gaya', devhubAlias='DevHub', projectName='GayaProject') { 
    const endpoint = `${SERVER}/api/v1/sforg/${method}?alias=${orgAlias}&devhub=${devhubAlias}&project=${projectName}`;
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            }
        });
        return response.json();
    } catch (e) {
        return e;
    }
}

export async function manageProject(method='create', projectName='GayaProject') { 
    const endpoint = `${SERVER}/api/v1/project/${method}?name=${projectName}`;
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            }
        });
        return response.json();
    } catch (e) {
        return e;
    }
}

export async function createFile(projectName='DemmyProject', filePath='', fileContent={} ) { 

    const endpoint = `${SERVER}/api/v1/file?name=${projectName}&filePath=${filePath}`;
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(fileContent)
        });
        return response.json();
    } catch (e) {
        return e;
    }
}

/*
 * Config Plan
 */
/**
 * {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "Access-Control-Allow-Origin":"*",
                "Access-Control-Allow-Headers":"Content-Type",
                "Access-Control-Allow-Methods": 'GET, POST, PUT, DELETE, OPTIONS',
                "Access-Control-Allow-Credentials": true
            }
 */
export async function generateConfigPlan(promptInput) {
    const endpoint = `${HOST}/generate-metadata-config-plan?requirements_prompt=${promptInput}`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            }
        });
        return response.json();
    } catch (e) {
        return e;
    }
}
/*
 * Analyze Salesforce Metadata Dependencies - API 2
 */
export async function analyseMetadataDependencies(requirements, filePaths) {
    const endpoint = `${HOST}/analyze-salesforce-metadata-dependencies/`;
    // const endpoint = 'http://0.0.0.0:8000/generate-metadata-config-plan/?requirements_prompt=-%20All%20metadata%20entries%20will%20use%20the%20prefix%20of%20TLB_%20-%20You%20will%20put%20the%20reasoning%20in%20the%20description%20section%20of%20each%20metadata%20part%20with%20the%20associated%20JIRA%20number%20-%20Create%201%20base%20profile%20%28%27Service%20User%27%20minimal%20access%29%20with%20permission%20sets%20%28HOC%20Base%2C%20Safety%20Base%2C%20Legal%20Base%2C%20Customer%20Resolution%20Base%2C%20Product%20Base%2C%20Inventory%20Base%29%2C%20Jira%20number%20IM-01%20-%20Create%203%20Case%20Recordtypes%20%28Holiday%20Incident%20Report%2C%20Post%20Travel%20Illness%20Report%2C%20Post%20Travel%20Injury%20Report%29%20put%20the%20desctiption%20of%20the%20Jira%20number%20IM-02%20in%20the%20description%20entry%20-%20Create%20a%20case%20severity%20field%20with%20the%20following%20values%20%28High%2CMedium%2CLow%29%2C%20Jira%20number%20IM-03%20-%20Create%20a%20custom%20case%20comments%20object%20which%20contains%20the%20following%20fields%20%28Data%20Raised%2C%20Entry%2C%20locked%29%2C%20Jira%20number%20IM-05%20-%20Create%20a%20case%20flow%20which%20Prompts%20the%20user%20-%20%27Do%20you%20wish%20to%20submit%20incident%3F%27%20if%20yes%2C%20change%20status%2C%20change%20record%20type%20to%20%27Incident%27%2C%20create%20associated%20%27Customer%20Welfare%27%20case%2C%20Jira%20number%20IM-10%20-%20Create%20a%20custom%20button%20on%20the%20case%20object%20which%20is%20called%20%27Submit%20Incident%27%20which%20launches%20the%20above%20flow%2C%20Jira%20number%20IM-21%20-%20Create%20a%20case%20Assignment%20rule%20which%20contains%20some%20possible%20teams%20to%20assign%20to%20for%20which%20incidents%2C%20Jira%20number%20IM-20';
    // const data = new URLSearchParams();
    //     data.append('requirements_prompt', promptInput);
    const req = {
        "requirements_prompt": requirements,
        "file_paths": filePaths
    }
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "accept": "application/json"
            },
            body: JSON.stringify({
                ...req
            })
        });
        return response.json();
    } catch (e) {
        return e;
    }
}
/*
 * Generate Metadata - API 3
 */
export async function generateMetadata(filename, file_paths, deps_analysis, prompt) {
    const endpoint = `${HOST}/generate-metadata/?filename=${filename}&file_paths=${file_paths}&deps_analysis=${deps_analysis}&prompt=${prompt}`;

    // const req = {
    //     "filename": filename,
    //     "file_paths": file_paths,
    //     "deps_analysis":deps_analysis,
    //     "prompt":prompt
    // }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "accept": "application/json"
            },
            // body: JSON.stringify({
            //     ...req
            // })
        });
        return response.json();
    } catch (e) {
        return e;
    }
}



