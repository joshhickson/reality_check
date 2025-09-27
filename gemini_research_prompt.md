# Google Gemini 2.5 Pro Deep Research Prompt: Diagnosing a Silent Node.js Server Crash

## **Role and Goal**

You are an expert systems engineer and a seasoned Node.js diagnostician with deep expertise in low-level Linux and V8 internals. Your task is to create a comprehensive, professional-grade diagnostic playbook to identify the root cause of a critical and silent server crash. The final output must be a step-by-step guide that a developer or SRE can follow to systematically investigate and solve the problem.

## **Problem Context**

We are facing a critical stability issue with a Node.js server application. The primary symptom is a **silent, unrecoverable crash**.

- The Node.js process terminates abruptly and completely without generating any application-level logs, error messages, or stack traces to `stdout` or `stderr`.
- The crash is preventing all further development and testing, making it a top-priority issue.
- Our initial hypothesis is that this is **not a bug in the application's JavaScript logic**. All evidence points toward a low-level, unrecoverable failure within the execution environment (e.g., OS, kernel, native dependency, or hardware).

## **Required Output: The Diagnostic Playbook**

Generate a detailed, multi-stage diagnostic playbook. The playbook must be structured logically, starting with the least invasive checks and progressing to more advanced, intensive debugging techniques.

For each step in the playbook, provide:
1.  **Objective:** What is the goal of this step?
2.  **Tools:** What specific command-line tools are required?
3.  **Procedure:** The exact commands to execute.
4.  **Analysis:** What specific output, patterns, or log entries should the investigator look for?
5.  **Interpretation:** How do the findings from this step confirm or deny a potential cause and what should the next step be?

## **Key Diagnostic Areas to Cover**

Your playbook must provide detailed instructions for investigating the following areas:

### **1. Operating System-Level Analysis**
- **System Logs:** How to use `journalctl`, `dmesg`, and check `/var/log/messages` or `/var/log/syslog` for clues (e.g., segmentation faults, kernel-level errors).
- **The OOM (Out Of Memory) Killer:** How to definitively confirm or rule out that the OOM Killer is terminating the process. Provide commands to check for OOM events for a specific process ID.
- **Resource Limits (`ulimit`):** How to inspect system-wide and user-specific resource limits (e.g., max open files, processes, memory). Explain how a misconfiguration could lead to a silent crash.
- **Kernel Panics:** How to check for evidence of a kernel panic that might be related to the process termination.

### **2. Node.js Runtime and Native Module Failures**
- **Native C++ Addons:** How to identify all native addons in the dependency tree. Provide a strategy for isolating a faulty addon (e.g., disabling them, running in a minimal environment).
- **V8 Engine and Garbage Collection:** Although less likely to be silent, explain how to use Node.js flags (`--trace-gc`, `--v8-options`) to look for anomalies in memory management that might precede a crash.

### **3. Advanced Post-Mortem Debugging**
- **Core Dump Analysis:**
    - How to enable core dump generation (`ulimit -c unlimited`).
    - How to trigger the crash and locate the core dump file.
    - A step-by-step guide to loading the core dump into a debugger (`gdb`, `lldb`).
    - The essential `gdb`/`lldb` commands to get a native stack trace (`bt`), inspect threads, and identify the exact line of C/C++ code where the fault occurred.
- **System Call Tracing:**
    - How to use `strace` (on Linux) or `dtruss` (on macOS) to attach to the running Node.js process.
    - How to configure the tracer to log output to a file and interpret the final system calls made just before the crash.

### **4. Hardware and Virtualization Environment Failures**
- **Hardware Faults:** Provide a strategy for ruling out underlying hardware issues (e.g., faulty RAM, disk I/O errors). Include tools like `memtester` or `badblocks`.
- **Containerized Environments (Docker/Kubernetes):** If the application is running in a container, explain how to check for container-specific issues like cgroup memory limits, kernel security profile violations (Seccomp, AppArmor), or issues with the container runtime itself.

## **Final Deliverable Format**

Present the final output in clear, well-structured Markdown. Use headings, code blocks, and lists to create a document that is easy to read and follow. The tone should be authoritative, clear, and practical.