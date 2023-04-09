const { ConfigValidator, ActionValidator } = require("../src/Validator");

describe("Validator", () => {
    describe("ConfigValidator", () => {
        it("should return validated config", async() => {
            const origObj = {};
            const validatedObj = await ConfigValidator.validate(origObj)
            expect(validatedObj).toStrictEqual({ "config-path": ".github/label-actions.yml",  "process-only": "" });
        });

        it("should return corrent config-path", async() => {
            const origObj = { "config-path": ".github/my-config.yml", "process-only": "prs" };
            const validatedObj = await ConfigValidator.validate(origObj)
            expect(validatedObj).toStrictEqual({ "config-path": ".github/my-config.yml", "process-only": "pr" });
        });

        it("should return correct token", async() => {
            const origObj = { "github-token": "my-token", "process-only": "issue" };
            const validatedObj = await ConfigValidator.validate(origObj)
            expect(validatedObj).toStrictEqual({ "config-path": ".github/label-actions.yml", "github-token": "my-token", "process-only": "issue" });
        });

        it("should return schema", () => {
            const schema = ConfigValidator.schema.describe().keys;
            expect(schema).toHaveProperty('config-path');
            expect(schema).toHaveProperty('github-token');
            expect(schema).toHaveProperty('process-only');
        });
    });
   
    describe("ActionValidator", () => {
        const DEFAULT_ACTION_CONFIG = {
            "close": false,
            "comment": "",
            "label": "",
            "lock": false,
            "lock-reason": "",
            "number-of-reviewers": 1,
            "reopen": false,
            "reviewers": [],
            "unlabel": "",
            "unlock": false,
        };

        it("should return default config", async() => {
            const origObj = { dummy: {} };
            const validatedObj = await ActionValidator.validate(origObj)
            expect(validatedObj).toStrictEqual({ "dummy": DEFAULT_ACTION_CONFIG });
        });

        it("should return all values", async() => {
            const origObj = { dummy: {
                "close": true,
                "comment": ["dummy comment"],
                "label": ["label1"],
                "lock": true,
                "lock-reason": "resolved",
                "number-of-reviewers": 2,
                "reopen": true,
                "reviewers": ['dummy-reviewer'],
                "unlabel": ["label2"],
                "unlock": true,
            }};
            const validatedObj = await ActionValidator.validate(origObj)
            expect(validatedObj).toStrictEqual({ "dummy": origObj.dummy });
        });

        it("should return comment", async() => {
            const origObj = { comment: { comment: ['my comment.'] } };
            const validatedObj = await ActionValidator.validate(origObj)
            expect(validatedObj).toStrictEqual({ "comment": {  ...DEFAULT_ACTION_CONFIG, ...origObj.comment } });
        });

        it("should return label", async() => {
            const origObj = { wip: { label: ['label1'] } };
            const validatedObj = await ActionValidator.validate(origObj)
            expect(validatedObj).toStrictEqual({ "wip": {  ...DEFAULT_ACTION_CONFIG, ...origObj.wip } });
        });
    
        it("should return pr.label", async() => {
            const origObj = { wip: { prs: { label: ['label1', 'label2'] } } };
            const validatedObj = await ActionValidator.validate(origObj)
            expect(validatedObj).toStrictEqual({ "wip": {  ...DEFAULT_ACTION_CONFIG, ...origObj.wip } });
        });

        it("should return reviewers", async() => {
            const origObj = { review: { prs: { reviewers: ['reviewer1', 'reviewer2'], 'number-of-reviewers': 2 } } };
            const validatedObj = await ActionValidator.validate(origObj)
            expect(validatedObj).toStrictEqual({ "review": {  ...DEFAULT_ACTION_CONFIG, ...origObj.review } });
        });
    });
});
