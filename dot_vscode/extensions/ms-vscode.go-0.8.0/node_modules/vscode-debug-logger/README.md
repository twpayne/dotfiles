** Obsolete, this is moved to https://github.com/Microsoft/vscode-debugadapter-node/blob/master/adapter/src/loggingDebugSession.ts **


# vscode-debug-logger

This library provides easy logging for VS Code debug adapters. It has a few features that any debug adapter needs:

* Logs to `console.log` only when running in server mode. Debug adapters communicate with the client over stdin/out during normal operation, and using `console.log` will disrupt that stream.
* Produces `OutputEvent`s with the proper `category` to display logs in the user's debug console.
* A debug adapter doesn't get the user's launch config settings until the launch/attach events are received, so this library queues events received until that time and flushes them when possible.
* Writes logs to a file.
* Truncates very long messages that can hang VS Code.


## Examples
Consider this all temporary - someday I'll rewrite it to use the [winston](https://github.com/winstonjs/winston) logging library, or something else.

```typescript
import * as logger from 'vscode-debug-logger';

import { DebugProtocol } from 'vscode-debugprotocol';
import { DebugSession } from 'vscode-debugadapter';

class MyDebugSession extends DebugSession {
    constructor(debuggerLinesStartAt1: boolean, isServer: boolean = false) {
        /**
         * init takes
         * - a callback for OutputEvents
         * - an optional path to the log file
         * - isServer, which determines whether to also use console.log
         */
        logger.init(e => this.sendEvent(e), logPath, isServer);
    }

    protected launchRequest(response: DebugProtocol.LaunchResponse, args: any): void {
        const logLevel =
            args.trace === 'verbose' ?
                logger.LogLevel.Verbose :
                args.trace === 'log' ?
                    logger.LogLevel.Log :
                    logger.LogLevel.Error;

        // Logs collected after 'init' will be flushed at this point.
        // Verbose logs always go to the file. minLogLevel determines the level of log messages that go to the console.
        logger.setMinLogLevel(logLevel);
    }

    protected stepInRequest(response: DebugProtocol.StepInResponse): void {
        logger.log('StepInRequest');

        // ...

        logger.error('some error');
    }
}
```

In other files, you can simply import logger again - you never need to pass a logging object around.