const ConfigValidator = require("../src/ConfigValidator");

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
