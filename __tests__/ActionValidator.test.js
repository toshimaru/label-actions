const ActionValidator = require("../src/ActionValidator");

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
        const originalConfig = { dummy: {} };
        const validatedConfig = await ActionValidator.validate(originalConfig)
        expect(validatedConfig).toStrictEqual({ "dummy": DEFAULT_ACTION_CONFIG });
    });

    it("should return all values", async() => {
        const originalConfig = { dummy: {
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
        const validatedConfig = await ActionValidator.validate(originalConfig)
        expect(validatedConfig).toStrictEqual({ "dummy": originalConfig.dummy });
    });

    it("should return comment", async() => {
        const originalConfig = { comment: { comment: ['my comment.'] } };
        const validatedConfig = await ActionValidator.validate(originalConfig)
        expect(validatedConfig).toStrictEqual({ "comment": {  ...DEFAULT_ACTION_CONFIG, ...originalConfig.comment } });
    });

    it("should return label", async() => {
        const originalConfig = { wip: { label: ['label1'] } };
        const validatedConfig = await ActionValidator.validate(originalConfig)
        expect(validatedConfig).toStrictEqual({ "wip": {  ...DEFAULT_ACTION_CONFIG, ...originalConfig.wip } });
    });

    it("should return pr.label", async() => {
        const originalConfig = { wip: { prs: { label: ['label1', 'label2'] } } };
        const validatedConfig = await ActionValidator.validate(originalConfig)
        expect(validatedConfig).toStrictEqual({ "wip": {  ...DEFAULT_ACTION_CONFIG, ...originalConfig.wip } });
    });

    it("should return reviewers", async() => {
        const originalConfig = { review: { prs: { reviewers: ['reviewer1', 'reviewer2'], 'number-of-reviewers': 2 } } };
        const validatedConfig = await ActionValidator.validate(originalConfig)
        expect(validatedConfig).toStrictEqual({ "review": {  ...DEFAULT_ACTION_CONFIG, ...originalConfig.review } });
    });
});
