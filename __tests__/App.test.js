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
            expect(debugLogSpy).toHaveBeenCalledTimes(1);
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

        describe('triggers `reviewers` action', () => {
            const config = { 'github-token': 'dummy-token' };
            
            it('adds a reviewer', async () => {
                const debugLogSpy = jest.spyOn(core, 'debug');
                const context = { 
                    payload: {
                        label: { name: 'test' }, 
                        pull_request: { user: {} } 
                    },
                    issue: { owner: 'toshimaru', repo: 'my-repo', number: 1 },
                    repo: { owner: 'toshimaru', repo: 'my-repo' }
                };
                jest.replaceProperty(github, 'context', context);
                const requestReviewers = jest.fn();
                mockContent('test:\n  prs:\n    reviewers: [toshimaru2]', { pulls: { requestReviewers: requestReviewers } });
        
                const app = new App(config);
                await app.performActions();
                expect(debugLogSpy).toHaveBeenCalledWith('Assigning reviewers');
                expect(requestReviewers).toHaveBeenCalledWith({
                    owner: context.repo.owner, repo: context.repo.repo, pull_number: context.issue.number, reviewers: ['toshimaru2']
                });
            });

            it('adds reviewers', async () => {
                const debugLogSpy = jest.spyOn(core, 'debug');
                const context = { 
                    payload: {
                        label: { name: 'test' }, 
                        pull_request: { user: {} } 
                    },
                    issue: { owner: 'toshimaru', repo: 'my-repo', number: 1 },
                    repo: { owner: 'toshimaru', repo: 'my-repo' }
                };
                jest.replaceProperty(github, 'context', context);
                const requestReviewers = jest.fn();
                mockContent('test:\n  prs:\n    reviewers: [toshimaru2, toshimaru3]\n    number-of-reviewers: 3', { pulls: { requestReviewers: requestReviewers } });
        
                const app = new App(config);
                await app.performActions();
                expect(debugLogSpy).toHaveBeenCalledWith('Assigning reviewers');
                expect(requestReviewers).toHaveBeenCalledWith({
                    owner: context.repo.owner, repo: context.repo.repo, pull_number: context.issue.number, reviewers: expect.arrayContaining(['toshimaru2', 'toshimaru3'])
                });
            });

            it(`doesn't assign an author as a reviewer`, async () => {
                const debugLogSpy = jest.spyOn(core, 'debug');
                const context = { 
                    payload: {
                        label: { name: 'test' }, 
                        pull_request: { user: { login: 'toshimaru2' } } 
                    },
                    issue: { owner: 'toshimaru', repo: 'my-repo', number: 1 },
                    repo: { owner: 'toshimaru', repo: 'my-repo' }
                };
                jest.replaceProperty(github, 'context', context);
                const requestReviewers = jest.fn();
                mockContent('test:\n  prs:\n    reviewers: [toshimaru2, toshimaru3]', { pulls: { requestReviewers: requestReviewers } });
        
                const app = new App(config);
                await app.performActions();
                expect(debugLogSpy).toHaveBeenCalledWith('Assigning reviewers');
                expect(requestReviewers).toHaveBeenCalledWith({
                    owner: context.repo.owner, repo: context.repo.repo, pull_number: context.issue.number, reviewers: ['toshimaru3']
                });
            });
        });

        describe('triggers `unlabel` action', () => {
            const config = { 'github-token': 'dummy-token' };
            
            it('unlabels a label', async () => {
                const debugLogSpy = jest.spyOn(core, 'debug');
                const context = { 
                    payload: {
                        label: { name: 'test' }, 
                        action: 'unlabeled',
                        pull_request: { labels: [ { name: "on hold" } ], number: 1 }
                    },
                    repo: { owner: 'toshimaru', repo: 'my-repo' }
                };
                jest.replaceProperty(github, 'context', context);
                const removeLabel = jest.fn();
                mockContent('-test:\n  prs:\n    unlabel: "on hold"', { issues: { removeLabel: removeLabel } });
        
                const app = new App(config);
                await app.performActions();
                expect(debugLogSpy).toHaveBeenCalledWith('Unlabeling');
                expect(removeLabel).toHaveBeenCalledWith({
                    owner: context.repo.owner, repo: context.repo.repo, issue_number: context.payload.pull_request.number, name: 'on hold'
                });
            });
        });
    });
});
