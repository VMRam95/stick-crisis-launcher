import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { spawn } from "child_process";
import * as path from "path";
import type { ExecuteDeploymentInput, DeploymentOutput } from "@/types";

// Path to the stick-crisis game repository
const STICK_CRISIS_REPO = path.resolve(process.cwd(), "../stick-crisis");

// POST - Execute deployment script
export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await isAdminAuthenticated();
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ExecuteDeploymentInput = await request.json();
    const { platforms, notifySubscribers = true, publishChangelog = true } = body;

    if (!platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: "At least one platform must be selected" },
        { status: 400 }
      );
    }

    // Build command arguments
    const args: string[] = [];

    // Platform flags
    if (platforms.length === 1) {
      if (platforms[0] === "mac") {
        args.push("--mac");
      } else if (platforms[0] === "windows") {
        args.push("--windows");
      }
    }
    // If both platforms, no flag needed (default behavior)

    // Changelog flag
    if (!publishChangelog) {
      args.push("--no-changelog");
    }

    // Notify flag
    if (!notifySubscribers) {
      args.push("--no-notify");
    }

    // Execute the script
    const scriptPath = path.join(STICK_CRISIS_REPO, "distribute_itch.sh");

    return new Promise<NextResponse>((resolve) => {
      let output = "";
      let errorOutput = "";

      const child = spawn("bash", [scriptPath, ...args], {
        cwd: STICK_CRISIS_REPO,
        env: {
          ...process.env,
          // Pass through necessary environment variables
          PATH: process.env.PATH,
          HOME: process.env.HOME,
        },
      });

      child.stdout.on("data", (data) => {
        const text = data.toString();
        output += text;
        console.log("[deploy stdout]:", text);
      });

      child.stderr.on("data", (data) => {
        const text = data.toString();
        errorOutput += text;
        console.error("[deploy stderr]:", text);
      });

      child.on("close", (code) => {
        const success = code === 0;
        const result: DeploymentOutput = {
          success,
          output: output + (errorOutput ? `\n\nErrors:\n${errorOutput}` : ""),
          error: success ? undefined : `Process exited with code ${code}`,
          platforms,
        };

        if (success) {
          // Extract version from output if possible
          const versionMatch = output.match(/Version:\s*(\S+)/);
          if (versionMatch) {
            result.deployedVersion = versionMatch[1];
          }
        }

        resolve(NextResponse.json(result, { status: success ? 200 : 500 }));
      });

      child.on("error", (err) => {
        const result: DeploymentOutput = {
          success: false,
          output,
          error: `Failed to start process: ${err.message}`,
          platforms,
        };
        resolve(NextResponse.json(result, { status: 500 }));
      });

      // Timeout after 10 minutes
      setTimeout(() => {
        if (!child.killed) {
          child.kill("SIGTERM");
          const result: DeploymentOutput = {
            success: false,
            output,
            error: "Deployment timed out after 10 minutes",
            platforms,
          };
          resolve(NextResponse.json(result, { status: 500 }));
        }
      }, 10 * 60 * 1000);
    });
  } catch (error) {
    console.error("Execute deployment error:", error);
    return NextResponse.json(
      {
        success: false,
        output: "",
        error: `Failed to execute deployment: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
