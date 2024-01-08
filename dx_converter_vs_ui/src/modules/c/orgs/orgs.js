import { LightningElement, api } from 'lwc';
import { getOrgs, getDefaultOrgs, manageOrg } from '../../data/services/services';

const SCRATCH_MENU_ACTIONS = [{ value: 'open_org', label: 'Open org', iconName: 'utility:preview' },
                            { value: 'deploy', label: 'Deploy', iconName: 'utility:anchor' },
                            { value: 'set_default', label: 'Set as Default', iconName: 'utility:anchor' },
                            { value: 'user_details', label: 'User Details', iconName: 'utility:clock' },
                            { value: 'user_password', label: 'Generate Password', iconName: 'utility:lock' }];

const ORG_MENU_ACTIONS = [{ value: 'open_org', label: 'Open org', iconName: 'utility:preview' }];                           
const ICONS = {
                DEVHUB: 'standard:environment_hub',
                SCRACH: 'standard:entity_milestone',
                DEFAULT: 'standard:assigned_resource',
                ORG: 'standard:data_streams',
                OFFLINE:'standard:default'
            }
export default class Orgs extends LightningElement {
    orgActions = ORG_MENU_ACTIONS;
    scratchActions = SCRATCH_MENU_ACTIONS;
    @api projectPath;

    _scratchOrgs = [];
    _nonScratchOrgs = [];
    cachedOrgs = [];
    orgPageIndex = 0;
    orgRecordsPerPage = 3;
    activeSections = ['B'];

    loading = false;
    processing = false;
    connectedCallback(){
        this.fetchConnectedOrgs();
    }

    handleRefreshOrgs(){
        this.fetchConnectedOrgs();
    }
    targetOrg;
    async fetchDefaultOrgs(){
        try {
            this.loading = true;
           const results = await getDefaultOrgs();
            if(results.data){
                console.log(results.data);
                this.loading = false;
                const configs = results.data.result;
                this.targetOrg = configs[0].value;
            }
        } catch (error) {
            this.loading = false;
            console.log('error gettings DX orgs ' + error.body );
        }
    }
    async fetchConnectedOrgs(){
        try {
            this.loading = true;
           const results = await getOrgs();
            if(results.data){
                console.log(results.data);
                this.loading = false;
                const {nonScratchOrgs, scratchOrgs} = results.data.result;
                this._scratchOrgs = scratchOrgs;
                this.cachedOrgs = nonScratchOrgs;
                this._nonScratchOrgs = this.paginate(this.orgPageIndex,this.orgRecordsPerPage,nonScratchOrgs);
            }
        } catch (error) {
            this.loading = false;
            console.log('error gettings DX orgs ' + error.body );
        }
    }

    get nonScratchOrgsTotalTitle(){
        return `Connected orgs (${this.cachedOrgs.length})`;
    }
    get nonScratchOrgs(){
        return this._nonScratchOrgs.map(org =>({...org, orgIcon: org.isDevHub ? ICONS.DEVHUB : ICONS.ORG }));
    }
    get scratchOrgs(){
        return this._scratchOrgs.map(org =>({...org, orgIcon: org.isDefaultUsername ? ICONS.DEFAULT : ICONS.SCRACH }));
    }

    handleBack(){
        this.orgPageIndex -= this.orgRecordsPerPage;
        this._nonScratchOrgs = this.paginate(this.orgPageIndex,this.orgRecordsPerPage,this.cachedOrgs);
    }
    handleNext(){
        this.orgPageIndex += this.orgRecordsPerPage;
       // this.orgRecordsPerPage += this.orgRecordsPerPage;
        this._nonScratchOrgs = this.paginate(this.orgPageIndex,this.orgRecordsPerPage,this.cachedOrgs);
    }
    get first(){
        return this.orgPageIndex === 0;
    }
    get last(){
        return this.orgPageIndex > this.cachedOrgs.length - this.orgRecordsPerPage;
    }
    openSettingsModal = false;
    orgAlias = '';

    handleTileSelectedMenuAction(event){
        // event.preventDefault();
        const actionName = event.detail.action.value;
        const orgalias = event.target.dataset.alias;
        console.log('actionName: ' +actionName);
        console.log('orgalias: ' +orgalias);
        switch (actionName) {
            case 'open_org':
                this.orgAlias = orgalias;
                    this.openOrg();
                break;
            case 'set_default':
                this.orgAlias = orgalias;
                    this.openOrg();
                break;
        
            default:
                break;
        }
    }

    blockNavigation(event){
        event.preventDefault();
    }
    
    currentAction = '';
    async openOrg(){
        try {
           await manageOrg('open', this.orgAlias, "DevHub", this.projectPath);
        } catch (error) {
            console.log('error open org ' + error.body );
        }
    }
    handleOrgAction(event){
        const actionName = event.detail.value;
        console.log('actionName: ' + actionName);
        this.currentAction = actionName;
        this.toggleSettingsModal();
    }

    async handleConnectOrg(){
        try {
            this.processing = true;
            const payload = await manageOrg(this.currentAction, this.orgAlias, "DevHub", this.projectPath);
            if(payload.data){
                console.log('success org created ');
                console.log(payload.data);
                this.processing = false;
                
                this.toggleSettingsModal();
                this.fetchConnectedOrgs();
            }
        } catch (error) {
            console.log('error create org ' + error.body );
        }
        
    }



    toggleSettingsModal(){
        this.openSettingsModal = !this.openSettingsModal;
    }

    setOrgAlias(event){
        this.orgAlias = event.target.value;
    }
    
    // Paginate results
    paginate(pageIndex = 0, recordsPerPage = 5, items = []) {
        // SET BETWEEN 0 MIN AND MAX LENGTH
        pageIndex = Math.min(Math.max(pageIndex, 0), items.length);
        return [...items].splice(pageIndex, recordsPerPage);
    }
}
