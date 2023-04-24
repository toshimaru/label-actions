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
            jest.replaceProperty(github, 'context', { payload: { label: { name: 'test' }, issue: { user: {}, number: 1 } }, repo: { owner: 'toshimaru', repo: 'my-repo' } });
            const createComment = jest.fn();
            mockContent('test:\n  comment: hello', { issues: { createComment: createComment } });
    
            const app = new App(config);
            await app.performActions();
            expect(github.getOctokit).toHaveBeenCalledWith(config['github-token']);
            expect(debugLogSpy).toHaveBeenCalledWith('Commenting');
            expect(createComment).toHaveBeenCalledWith({ owner: 'toshimaru', repo: 'my-repo', issue_number: 1, body: 'hello' });
        });
    });
});
