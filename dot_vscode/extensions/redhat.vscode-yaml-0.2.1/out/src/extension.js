/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Adam Voss. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const schema_contributor_1 = require("./schema-contributor");
var SchemaAssociationNotification;
(function (SchemaAssociationNotification) {
    SchemaAssociationNotification.type = new vscode_languageclient_1.NotificationType('json/schemaAssociations');
})(SchemaAssociationNotification || (SchemaAssociationNotification = {}));
var DynamicCustomSchemaRequestRegistration;
(function (DynamicCustomSchemaRequestRegistration) {
    DynamicCustomSchemaRequestRegistration.type = new vscode_languageclient_1.NotificationType('yaml/registerCustomSchemaRequest');
})(DynamicCustomSchemaRequestRegistration || (DynamicCustomSchemaRequestRegistration = {}));
function activate(context) {
    // The server is implemented in node
    let serverModule = context.asAbsolutePath(path.join('node_modules', 'yaml-language-server', 'out', 'server', 'src', 'server.js'));
    // The debug options for the server
    let debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    let serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
    };
    // Options to control the language client
    let clientOptions = {
        // Register the server for plain text documents
        documentSelector: [
            { language: 'yaml', scheme: 'file' },
            { language: 'yaml', scheme: 'untitled' }
        ],
        synchronize: {
            // Synchronize the setting section 'languageServerExample' to the server
            configurationSection: ['yaml', 'http.proxy', 'http.proxyStrictSSL'],
            // Notify the server about file changes to '.clientrc files contain in the workspace
            fileEvents: [
                vscode_1.workspace.createFileSystemWatcher('**/*.?(e)y?(a)ml'),
                vscode_1.workspace.createFileSystemWatcher('**/*.json')
            ]
        }
    };
    // Create the language client and start the client.
    let client = new vscode_languageclient_1.LanguageClient('yaml', 'Yaml Support', serverOptions, clientOptions);
    let disposable = client.start();
    // Push the disposable to the context's subscriptions so that the
    // client can be deactivated on extension deactivation
    context.subscriptions.push(disposable);
    client.onReady().then(() => {
        client.sendNotification(SchemaAssociationNotification.type, getSchemaAssociation(context));
        client.sendNotification(DynamicCustomSchemaRequestRegistration.type);
        client.onRequest(schema_contributor_1.CUSTOM_SCHEMA_REQUEST, (resource) => {
            return schema_contributor_1.schemaContributor.requestCustomSchema(resource);
        });
        client.onRequest(schema_contributor_1.CUSTOM_CONTENT_REQUEST, (uri) => {
            return schema_contributor_1.schemaContributor.requestCustomSchemaContent(uri);
        });
    });
    vscode_1.languages.setLanguageConfiguration('yaml', {
        wordPattern: /("(?:[^\\\"]*(?:\\.)?)*"?)|[^\s{}\[\],:]+/
    });
    return schema_contributor_1.schemaContributor;
}
exports.activate = activate;
function getSchemaAssociation(context) {
    let associations = {};
    vscode_1.extensions.all.forEach(extension => {
        let packageJSON = extension.packageJSON;
        if (packageJSON && packageJSON.contributes && packageJSON.contributes.yamlValidation) {
            let yamlValidation = packageJSON.contributes.yamlValidation;
            if (Array.isArray(yamlValidation)) {
                yamlValidation.forEach(jv => {
                    let { fileMatch, url } = jv;
                    if (fileMatch && url) {
                        if (url[0] === '.' && url[1] === '/') {
                            url = vscode_1.Uri.file(path.join(extension.extensionPath, url)).toString();
                        }
                        if (fileMatch[0] === '%') {
                            fileMatch = fileMatch.replace(/%APP_SETTINGS_HOME%/, '/User');
                            fileMatch = fileMatch.replace(/%APP_WORKSPACES_HOME%/, '/Workspaces');
                        }
                        else if (fileMatch.charAt(0) !== '/' && !fileMatch.match(/\w+:\/\//)) {
                            fileMatch = '/' + fileMatch;
                        }
                        let association = associations[fileMatch];
                        if (!association) {
                            association = [];
                            associations[fileMatch] = association;
                        }
                        association.push(url);
                    }
                });
            }
        }
    });
    return associations;
}
//# sourceMappingURL=extension.js.map