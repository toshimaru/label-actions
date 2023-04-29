const App = require("../src/App");
const github = require('@actions/github');
const core = require('@actions/core');

function mockContent(content, additionalRestMethods = {}) {
    const getOctokit = jest.fn(() => {
        const getContent = jest.fn(() => {
            return {
                data: {
                    content:  Buffer.from(content).toString('base64')
                },
            };
        });
        return {
            rest: {
                repos: { getContent: getContent },
                ...additionalRestMethods,
            },
        };
    });
    jest.spyOn(github, 'getOctokit').mockImplementation(getOctokit);
}

describe("App", () => {
    describe("performActions", () => {
        afterEach(() => jest.restoreAllMocks());

        it('finds no actions', async () => {
            const config = { 'github-token': 'dummy-token' };
            const debugLogSpy = jest.spyOn(core, 'debug');
            jest.replaceProperty(github, 'context', { payload: { label: { name: '' } } });
            mockContent('test:\n  comment: hello');
    
            const app = new App(config);
            await app.performActions();
            expect(github.getOctokit).toHaveBeenCalledWith(config['github-token']);
            expect(debugLogSpy).toHaveBeenCalledWith('No actions found');
        });

        it('triggers `comment` action', async () => {
            const config = { 'github-token': 'dummy-token' };
            const debugLogSpy = jest.spyOn(core, 'debug');
            const context = { 
                payload: {
                    label: { name: 'test' }, 
                    issue: { user: { login: 'test-user' }, number: 1 } 
                },
                repo: { owner: 'toshimaru', repo: 'my-repo' }
            };
            jest.replaceProperty(github, 'context', context);
            const createComment = jest.fn();
            mockContent('test:\n  comment: "@{issue-author} hello"', { issues: { createComment: createComment } });
    
            const app = new App(config);
            await app.performActions();
            expect(debugLogSpy).toHaveBeenCalledWith('Commenting');
            expect(createComment).toHaveBeenCalledWith({
                owner: context.repo.owner, repo: context.repo.repo, issue_number: context.payload.issue.number, body: '@test-user hello'
            });
        });

        describe('triggers `label` action', () => {
            const config = { 'github-token': 'dummy-token' };
            
            it('adds a label', async () => {
                const debugLogSpy = jest.spyOn(core, 'debug');
                const context = { 
                    payload: {
                        label: { name: 'test' }, 
                        pull_request: { user: { login: 'test-user' }, number: 1, labels: [] } 
                    },
                    repo: { owner: 'toshimaru', repo: 'my-repo' }
                };
                jest.replaceProperty(github, 'context', context);
                const addLabels = jest.fn();
                mockContent('test:\n  prs:\n    label: "on hold"', { issues: { addLabels: addLabels } });
        
                const app = new App(config);
                await app.performActions();
                expect(debugLogSpy).toHaveBeenCalledWith('Labeling');
                expect(addLabels).toHaveBeenCalledWith({
                    owner: context.repo.owner, repo: context.repo.repo, issue_number: context.payload.pull_request.number, labels: ['on hold']
                });
            });

            it('adds a label that was already assigned', async () => {
                const debugLogSpy = jest.spyOn(core, 'debug');
                const context = { 
                    payload: {
                        label: { name: 'test' }, 
                        pull_request: { user: { login: 'test-user' }, number: 1, labels: [ { name: "on hold" }] } 
                    },
                    repo: { owner: 'toshimaru', repo: 'my-repo' }
                };
                jest.replaceProperty(github, 'context', context);
                const addLabels = jest.fn();
                mockContent('test:\n  prs:\n    label: "on hold"', { issues: { addLabels: addLabels } });
        
                const app = new App(config);
                await app.performActions();
                expect(debugLogSpy).not.toHaveBeenCalledWith('Labeling');
                expect(addLabels).not.toBeCalled();
            });
            
            it('adds labels', async () => {
                const debugLogSpy = jest.spyOn(core, 'debug');
                const context = { 
                    payload: {
                        label: { name: 'test' }, 
                        pull_request: { user: { login: 'test-user' }, number: 1, labels: [] } 
                    },
                    repo: { owner: 'toshimaru', repo: 'my-repo' }
                };
                jest.replaceProperty(github, 'context', context);
                const addLabels = jest.fn();
                mockContent('test:\n  prs:\n    label: ["on hold", "pending"]', { issues: { addLabels: addLabels } });
        
                const app = new App(config);
                await app.performActions();
                expect(debugLogSpy).toHaveBeenCalledWith('Labeling');
                expect(addLabels).toHaveBeenCalledWith({
                    owner: context.repo.owner, repo: context.repo.repo, issue_number: context.payload.pull_request.number, labels: ['on hold', 'pending']
                });
            });
        });
    });
});
