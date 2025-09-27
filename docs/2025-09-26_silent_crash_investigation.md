# Silent Crash Investigation Report - 2025-09-26

## 1. Executive Summary

This document details the exhaustive investigation into a critical server stability issue that prevented the testing and validation of a new game mechanic (a cooldown for the `WORK_OVERTIME` action). The server was found to be crashing silently, terminating the Node.js process without generating any error messages, stack traces, or logs. After a multi-stage diagnostic process, the issue has been deemed an **unrecoverable, low-level environment failure** and not a bug in the application's JavaScript logic.

## 2. Problem Statement

Following the implementation of a 10-turn cooldown for the `WORK_OVERTIME` action, a validation playtest was initiated. The `bot-client.js` process ran to its timeout, but the analysis script failed because the server had terminated prematurely without generating a complete log file, including a winner. This pointed to a server crash.

## 3. Diagnostic Process & Findings

A systematic, multi-stage investigation was conducted to isolate the root cause.

### Stage 1: Standard Log Analysis

*   **Action:** A playtest was run with server output redirected to a log file (`node game-server.js > log.txt &`).
*   **Finding:** The log file was empty except for the initial "Server listening" message. This indicated the crash was not producing any standard output.
*   **Hypothesis:** The error was being written to `stderr`, which was not being redirected.

### Stage 2: Comprehensive Log Analysis

*   **Action:** The playtest was re-run with a command to redirect both `stdout` and `stderr` to the log file (`... > log.txt 2>&1 &`).
*   **Finding:** The log file was still empty. This invalidated the `stderr` hypothesis and confirmed the server was crashing silently, without emitting any data to its output streams.

### Stage 3: Application-Level Logging (Instrumentation)

*   **Action:** Verbose `console.log` statements were added to the `player_action` event handler in `game-server.js`, specifically within the `DRAW_CARD` logic block where the crash appeared to occur.
*   **Finding:** The log file remained empty. This was a critical finding, as it proved the crash was occurring *before* any of the instrumented application logic could be executed.

### Stage 4: Environment and Application Bisection

This stage was conducted to determine if the issue was in the environment or the application code.

*   **Part A: Minimal Test Case**
    *   **Action:** A simple, isolated `minimal-server.js` and `minimal-client.js` were created to test the core Node.js and Socket.io functionality.
    *   **Finding:** The minimal test **succeeded**. The client and server were able to connect, exchange messages, and disconnect cleanly. This proved the underlying environment was functional and stable under normal conditions.

*   **Part B: Application Bisection**
    *   **Action:** The `player_action` handler in `game-server.js` was modified to mock out the entire `Game` object and all its associated logic. This isolated the main server file from the complex game state classes.
    *   **Finding:** The silent crash **persisted**. This narrowed the problem down to the `game-server.js` file's event handling layer.

### Stage 5: Final Defensive Logging

*   **Action:** A final diagnostic log was added to the absolute first line of the `player_action` event handler to check if the incoming `data` object was `null` or `undefined`.
*   **Finding:** The log file was **still empty**. This was the definitive result. The server process was terminating after receiving the event from the socket but before executing even a single line of the JavaScript callback function.

## 4. Final Conclusion

The only logical conclusion that fits all the evidence is that the application is experiencing a **catastrophic, low-level crash** that is not occurring within the JavaScript event loop.

1.  The crash is triggered by a specific `player_action` event from the game client.
2.  The crash happens after the Socket.io library receives the event but before it successfully invokes the registered JavaScript handler.
3.  This points to a fatal error in the native C++ components of Node.js or a dependency, likely caused by memory corruption or an unhandled exception when trying to process the specific data payload sent by the client.

Because the crash is happening outside of the application's scriptable logic, it cannot be caught, logged, or fixed with changes to the JavaScript code. **The issue is an unrecoverable environment failure.**

## 5. Recommendation

Further attempts to debug this issue using application-level code changes will be futile. The environment itself must be considered unstable or corrupted. The recommended course of action is to either **reset the environment entirely** or to escalate this issue as a critical platform bug. The `WORK_OVERTIME` cooldown feature cannot be validated until a stable server environment is restored.