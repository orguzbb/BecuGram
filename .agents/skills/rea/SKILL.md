---
name: rea
description: >-
  Reverse engineer, decompile, and inspect software applications, native binaries (PE, ELF, Mach-O),
  Electron/JavaScript bundles (.asar, unpacked code), and .NET assemblies using REA (Reverse Engineer Anything)
  and the REA MCP server. Use when the user asks to analyze compiled binaries, extract web/electron bundles,
  or perform reverse engineering diagnostics.
---

# REA (Reverse Engineer Anything)

REA is an automated reverse-engineering toolkit and Model Context Protocol (MCP) server for AI coding agents.

## Capabilities
- **JavaScript & Electron Analysis**: Unpacks and analyzes `.asar` archives, Webpack/Vite bundles, minified scripts, and Node.js applications.
- **Binary Inspection**: Disassembles, inspects symbols, imports/exports, strings, and structures in native PE/ELF/Mach-O binaries and .NET assemblies.
- **MCP Integration**: Directly communicates via Model Context Protocol (`rea-agents mcp`) to provide interactive analysis tools.
- **Diagnostic Health Check**: Run `npx rea-agents@latest doctor` to verify decompilers and binary analysis tools.

## Common Workflows
1. **Health Check & Diagnostics**:
   ```bash
   npx rea-agents@latest doctor --json
   ```
2. **Direct Static JavaScript Analysis**:
   ```bash
   npx -y rea-agents@latest analyze-javascript-application "/path/to/app" --json
   ```
3. **Application Bundle Inspection**:
   Use the `rea` MCP tools to inspect routes, storage keys, cryptographic primitives, and exported API endpoints.
