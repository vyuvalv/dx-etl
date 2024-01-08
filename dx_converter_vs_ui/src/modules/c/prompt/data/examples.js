export const EXAMPLES = [
    `Create a custom Case Comments object with the following custom fields: Data Raised(TextArea), Entry(RichText), Locked(Checkbox)`,
    `Create a custom formula field that shows a traffic light image red, orange, green based on Rating field value - Hot,Medium, Low, Hot will be green, medium is orange and Low is Red.`,
    `Create Apex class that has a dynamic query and get field api names as a set, object name and return records. Add unit test.`,
    `Create 1 base profile ('Service User' minimal access) with permission sets (HOC Base, Safety Base, Legal Base, Customer Resolution Base, Product Base, Inventory Base)`,
    `Create a case flow which Prompts the user - 'Do you wish to submit incident?' if yes, change status, change record type to 'Incident', create associated 'Customer Welfare'`,
    `Create a case Assignment rule which contains some possible teams to assign to for which incidents'`,
    `Create a custom button on the case object which is called 'Submit Incident' which launches the above flow`,
    `Create approval process on Opportunity with entry criteria when amount bigger than 100000 request approval from manager`
];


const SAMPLE_REQUEST = `- Create 1 base profile ('Service User' minimal access) with permission sets (HOC Base, Safety Base, Legal Base, Customer Resolution Base, Product Base, Inventory Base), Jira number IM-01
- Create 3 Case Recordtypes (Holiday Incident Report, Post Travel Illness Report, Post Travel Injury Report) put the desctiption of the Jira number IM-02 in the description entry
- Create a case severity field with the following values (High,Medium,Low), Jira number IM-03
- Create a custom case comments object which contains the following fields (Data Raised, Entry, locked), Jira number IM-05
- Create a case flow which Prompts the user - 'Do you wish to submit incident?' if yes, change status, change record type to 'Incident', create associated 'Customer Welfare' case, Jira number IM-10
- Create a custom button on the case object which is called 'Submit Incident' which launches the above flow, Jira number IM-21
- Create a case Assignment rule which contains some possible teams to assign to for which incidents, Jira number IM-20
`;