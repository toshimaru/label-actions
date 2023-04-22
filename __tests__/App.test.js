const App = require("../src/App");
const github = require('@actions/github');
const core = require('@actions/core');

const coreSpy = jest.spyOn(core, 'debug');

function mockContent(content) {
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
            },
        };
    });
    jest.spyOn(github, 'getOctokit').mockImplementation(getOctokit);
}

describe("App", () => {
    describe("performActions", () => {
        it('finds no actions', async () => {
            const config = { 'github-token': 'dummy-token' };
            jest.replaceProperty(github, 'context', { payload: { label: { name: '' } } });
            mockContent('test:\n  comment: hello');
    
            const app = new App(config);
            await app.performActions();
            expect(coreSpy).toHaveBeenCalledWith('No actions found');
            expect(github.getOctokit).toHaveBeenCalledWith(config['github-token']);
        });
    });
});
