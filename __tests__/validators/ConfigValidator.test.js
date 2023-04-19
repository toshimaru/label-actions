const ConfigValidator = require("../../src/validators/ConfigValidator");

describe("ConfigValidator", () => {
    it("should return validated config", async() => {
        const originalConfig = {};
        const validatedConfig = await ConfigValidator.validate(originalConfig)
        expect(validatedConfig).toStrictEqual({ "config-path": ".github/label-actions.yml",  "process-only": "" });
    });

    it("should return corrent config-path", async() => {
        const originalConfig = { "config-path": ".github/my-config.yml", "process-only": "prs" };
        const validatedConfig = await ConfigValidator.validate(originalConfig)
        expect(validatedConfig).toStrictEqual({ "config-path": ".github/my-config.yml", "process-only": "pr" });
    });

    it("should return correct token", async() => {
        const originalConfig = { "github-token": "my-token", "process-only": "issue" };
        const validatedConfig = await ConfigValidator.validate(originalConfig)
        expect(validatedConfig).toStrictEqual({ "config-path": ".github/label-actions.yml", "github-token": "my-token", "process-only": "issue" });
    });

    it("should return schema keys", () => {
        const keys = ConfigValidator.schemaKeys;
        expect(keys).toContain('config-path');
        expect(keys).toContain('process-only');
        expect(keys).toContain('github-token');
    });
});
