export const TABS = [
    {
        label:'Prompt',
        name:'prompt',
        icon:"action:flow",
        value:0
    },
    {
        label:'Files',
        name:'files_paths',
        icon:"action:new_notebook",
        value:1
    },
    {
        label:'Dependencies',
        name:'deps_plan',
        icon:"action:new_notebook",
        value:2
    },
    {
        label:'Build',
        name:'build',
        icon:"action:apex",
        value:3
    }
];
export const STAGES = [
    {
        order: 1,
        label:'Requirements / Instructions',
        icon:"action:flow",
        title:"Add project requirements",
        description:"Upload, integrate or write simple requirements for this project"
    },
    {
        order: 2,
        label:'Initial Scaffolding',
        icon:"action:new_notebook",
        title:"Initial Scaffolding Plan and Dependencies Plan",
        description:"View the initial scaffold files plan and Figure out the dependencies plan between files"
    },
    {
        order: 3,
        label:'Code Generation',
        icon:"action:apex",
        title:"Code Generation",
        description:"Write the code for me"
    },
    {
        order: 4,
        label:'Test',
        icon:"action:bug",
        title:"Test",
        description:"Test the Code"
    },
    {
        order: 5,
        label:'Demo',
        icon:"action:goal",
        title:"Demo",
        description:"Ready for Demo"
    }
];