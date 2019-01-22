"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_uri_1 = require("vscode-uri");
class SchemaContributor {
    constructor() {
        this._customSchemaContributors = {};
    }
    /**
     * Register a custom schema provider
     *
     * @param {string} the provider's name
     * @param requestSchema the requestSchema function
     * @param requestSchemaContent the requestSchemaContent function
     * @returns {boolean}
     */
    registerContributor(schema, requestSchema, requestSchemaContent) {
        if (this._customSchemaContributors[schema]) {
            return false;
        }
        if (!requestSchema) {
            throw new Error("Illegal parameter for requestSchema.");
        }
        this._customSchemaContributors[schema] = {
            requestSchema,
            requestSchemaContent
        };
        return true;
    }
    /**
     * Call requestSchema for each provider and find the first one who reports he can provide the schema.
     *
     * @param {string} resource
     * @returns {string} the schema uri
     */
    requestCustomSchema(resource) {
        for (let customKey of Object.keys(this._customSchemaContributors)) {
            const contributor = this._customSchemaContributors[customKey];
            const uri = contributor.requestSchema(resource);
            if (uri) {
                return uri;
            }
        }
    }
    /**
     * Call requestCustomSchemaContent for named provider and get the schema content.
     *
     * @param {string} uri the schema uri returned from requestSchema.
     * @returns {string} the schema content
     */
    requestCustomSchemaContent(uri) {
        if (uri) {
            let _uri = vscode_uri_1.default.parse(uri);
            if (_uri.scheme && this._customSchemaContributors[_uri.scheme] &&
                this._customSchemaContributors[_uri.scheme].requestSchemaContent) {
                return this._customSchemaContributors[_uri.scheme].requestSchemaContent(uri);
            }
        }
    }
}
// global instance
const schemaContributor = new SchemaContributor();
exports.schemaContributor = schemaContributor;
// constants
exports.CUSTOM_SCHEMA_REQUEST = 'custom/schema/request';
exports.CUSTOM_CONTENT_REQUEST = 'custom/schema/content';
//# sourceMappingURL=schema-contributor.js.map