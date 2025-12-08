import { NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { spawn, execSync } from "child_process";
import * as path from "path";
import type { ExecuteDeploymentInput } from "@/types";

// Path to the stick-crisis game repository
const STICK_CRISIS_REPO = path.resolve(process.cwd(), "../stick-crisis");

// Strip ANSI escape codes from text
function stripAnsiCodes(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

// Create and push a git tag
function createAndPushTag(
  version: string,
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController
): { success: boolean; error?: string } {
  const tagName = version.startsWith("v") ? version : `v${version}`;

  try {
    // Check if tag already exists
    try {
      execSync(`git rev-parse ${tagName}`, {
        cwd: STICK_CRISIS_REPO,
        encoding: "utf-8",
        stdio: "pipe",
      });
      // Tag exists
      return { success: false, error: `Tag ${tagName} already exists` };
    } catch {
      // Tag doesn't exist, good to proceed
    }

    // Fetch latest
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({ type: "stdout", data: `\n📌 Creating tag ${tagName}...\n` })}\n\n`
      )
    );

    execSync("git fetch origin --tags", {
      cwd: STICK_CRISIS_REPO,
      encoding: "utf-8",
      stdio: "pipe",
    });

    // Create annotated tag at origin/develop
    execSync(`git tag -a ${tagName} origin/develop -m "Release ${tagName}"`, {
      cwd: STICK_CRISIS_REPO,
      encoding: "utf-8",
      stdio: "pipe",
    });

    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({ type: "stdout", data: `✓ Tag ${tagName} created locally\n` })}\n\n`
      )
    );

    // Push tag to remote
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({ type: "stdout", data: `📤 Pushing tag to origin...\n` })}\n\n`
      )
    );

    execSync(`git push origin ${tagName}`, {
      cwd: STICK_CRISIS_REPO,
      encoding: "utf-8",
      stdio: "pipe",
    });

    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({ type: "stdout", data: `✓ Tag ${tagName} pushed to origin\n` })}\n\n`
      )
    );

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    // Try to clean up local tag if push failed
    try {
      execSync(`git tag -d ${tagName}`, {
        cwd: STICK_CRISIS_REPO,
        encoding: "utf-8",
        stdio: "pipe",
      });
    } catch {
      // Ignore cleanup errors
    }

    return { success: false, error: message };
  }
}

// POST - Execute deployment script with streaming output
export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await isAdminAuthenticated();
    if (!isAuthenticated) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: ExecuteDeploymentInput = await request.json();
    const {
      platforms,
      version,
      notifySubscribers = true,
      publishChangelog = true,
    } = body;

    if (!platforms || platforms.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one platform must be selected" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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

    // Changelog flag
    if (!publishChangelog) {
      args.push("--no-changelog");
    }

    // Notify flag
    if (!notifySubscribers) {
      args.push("--no-notify");
    }

    const scriptPath = path.join(STICK_CRISIS_REPO, "distribute_itch.sh");

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        let output = "";

        const child = spawn("bash", [scriptPath, ...args], {
          cwd: STICK_CRISIS_REPO,
          env: {
            ...process.env,
            PATH: process.env.PATH,
            HOME: process.env.HOME,
          },
        });

        // Send initial event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "start", message: "Starting deployment..." })}\n\n`
          )
        );

        child.stdout.on("data", (data) => {
          const text = data.toString();
          output += text;
          console.log("[deploy stdout]:", text);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "stdout", data: text })}\n\n`)
          );
        });

        child.stderr.on("data", (data) => {
          const text = data.toString();
          output += text;
          console.error("[deploy stderr]:", text);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "stderr", data: text })}\n\n`)
          );
        });

        child.on("close", (code) => {
          const deploySuccess = code === 0;

          // Extract version from output if possible
          let deployedVersion: string | undefined;
          const versionMatch = output.match(/Version:\s*(\S+)/);
          if (versionMatch) {
            // Strip ANSI escape codes from version (script output contains color codes)
            deployedVersion = stripAnsiCodes(versionMatch[1]);
          }

          // If deployment successful and version provided, create tag
          let tagCreated = false;
          let tagError: string | undefined;

          if (deploySuccess && version) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "stdout", data: "\n🏷️  Creating release tag...\n" })}\n\n`
              )
            );

            const tagResult = createAndPushTag(version, encoder, controller);
            tagCreated = tagResult.success;
            tagError = tagResult.error;

            if (tagCreated) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "stdout", data: `\n✅ Release v${version} complete!\n` })}\n\n`
                )
              );
            } else {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "stderr", data: `\n⚠️ Tag creation failed: ${tagError}\n` })}\n\n`
                )
              );
            }
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                success: deploySuccess,
                exitCode: code,
                deployedVersion: deployedVersion || version,
                platforms,
                tagCreated,
                tagError,
              })}\n\n`
            )
          );
          controller.close();
        });

        child.on("error", (err) => {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: `Failed to start process: ${err.message}`,
              })}\n\n`
            )
          );
          controller.close();
        });

        // Timeout after 10 minutes
        const timeout = setTimeout(() => {
          if (!child.killed) {
            child.kill("SIGTERM");
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  message: "Deployment timed out after 10 minutes",
                })}\n\n`
              )
            );
            controller.close();
          }
        }, 10 * 60 * 1000);

        // Clear timeout when process ends
        child.on("close", () => clearTimeout(timeout));
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Execute deployment error:", error);
    return new Response(
      JSON.stringify({
        error: `Failed to execute deployment: ${error instanceof Error ? error.message : "Unknown error"}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
