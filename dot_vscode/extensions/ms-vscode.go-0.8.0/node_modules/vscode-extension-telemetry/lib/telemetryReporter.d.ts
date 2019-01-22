import * as vscode from 'vscode';
export default class TelemetryReporter extends vscode.Disposable {
    private extensionId;
    private extensionVersion;
    private appInsightsClient;
    private userOptIn;
    private toDispose;
    private static TELEMETRY_CONFIG_ID;
    private static TELEMETRY_CONFIG_ENABLED_ID;
    private logStream;
    constructor(extensionId: string, extensionVersion: string, key: string);
    private updateUserOptIn;
    private createAppInsightsClient;
    private getCommonProperties;
    sendTelemetryEvent(eventName: string, properties?: {
        [key: string]: string;
    }, measurements?: {
        [key: string]: number;
    }): void;
    dispose(): Promise<any>;
}
