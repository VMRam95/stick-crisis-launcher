import { NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { spawn, execSync } from "child_process";
import * as path from "path";
import type { ExecuteDeploymentInput } from "@/types";

// Check if running on Vercel (serverless) or locally
function isRunningLocally(): boolean {
  return process.env.VERCEL !== "1";
}

// Path to the stick-crisis game repository
const STICK_CRISIS_REPO = path.resolve(process.cwd(), "../stick-crisis");

// Strip ANSI escape codes from text
function stripAnsiCodes(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

// Create and push a git tag (with streaming output)
function createAndPushTag(
  version: string,
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController
): { success: boolean; alreadyExisted: boolean; error?: string } {
  const tagName = version.startsWith("v") ? version : `v${version}`;

  try {
    // Check if tag already exists
    try {
      execSync(`git rev-parse ${tagName}`, {
        cwd: STICK_CRISIS_REPO,
        encoding: "utf-8",
        stdio: "pipe",
      });
      // Tag exists - return success but mark as already existed (no rollback needed)
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "stdout", data: `✓ Tag ${tagName} already exists\n` })}\n\n`
        )
      );
      return { success: true, alreadyExisted: true };
    } catch {
      // Tag doesn't exist, need to create
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
        `data: ${JSON.stringify({ type: "stdout", data: `✓ Tag ${tagName} pushed to origin\n\n` })}\n\n`
      )
    );

    return { success: true, alreadyExisted: false };
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

    return { success: false, alreadyExisted: false, error: message };
  }
}

// Delete a git tag (for rollback on deployment failure)
function deleteTag(version: string): void {
  const tagName = version.startsWith("v") ? version : `v${version}`;

  try {
    // Delete local tag
    execSync(`git tag -d ${tagName}`, {
      cwd: STICK_CRISIS_REPO,
      encoding: "utf-8",
      stdio: "pipe",
    });
  } catch {
    // Ignore - tag might not exist locally
  }

  try {
    // Delete remote tag
    execSync(`git push origin :refs/tags/${tagName}`, {
      cwd: STICK_CRISIS_REPO,
      encoding: "utf-8",
      stdio: "pipe",
    });
  } catch {
    // Ignore - tag might not exist remotely
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

    // Block execution on Vercel - requires local environment
    if (!isRunningLocally()) {
      return new Response(
        JSON.stringify({
          error: "Deployment execution is only available in local environment",
          message: "This feature requires access to local build files and butler CLI. Please run deployments from your local development environment.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
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
        let tagCreatedByUs = false; // Track if WE created a new tag (for rollback)

        // Send initial event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "start", message: "Starting deployment..." })}\n\n`
          )
        );

        // Create tag FIRST if version provided (so git describe returns new version)
        if (version) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "stdout", data: "🏷️  Creating release tag before deployment...\n" })}\n\n`
            )
          );

          const tagResult = createAndPushTag(version, encoder, controller);

          if (!tagResult.success) {
            // Tag creation failed - abort deployment
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  message: `Failed to create tag: ${tagResult.error}`,
                })}\n\n`
              )
            );
            controller.close();
            return;
          }

          // Only rollback if WE created the tag (not if it already existed)
          tagCreatedByUs = !tagResult.alreadyExisted;
        }

        const child = spawn("bash", [scriptPath, ...args], {
          cwd: STICK_CRISIS_REPO,
          env: {
            ...process.env,
            PATH: process.env.PATH,
            HOME: process.env.HOME,
          },
        });

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

          // Handle deployment result
          if (deploySuccess) {
            // Success - tag was already created before script ran
            if (version) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "stdout", data: `\n✅ Release v${version} complete!\n` })}\n\n`
                )
              );
            }
          } else {
            // Deployment failed - rollback tag if we created it
            if (tagCreatedByUs && version) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "stderr", data: `\n⚠️ Deployment failed. Rolling back tag v${version}...\n` })}\n\n`
                )
              );
              deleteTag(version);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "stderr", data: `✓ Tag v${version} rolled back\n` })}\n\n`
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
                tagCreated: deploySuccess && !!version,
                tagError: undefined,
              })}\n\n`
            )
          );
          controller.close();
        });

        child.on("error", (err) => {
          // Rollback tag if we created it
          if (tagCreatedByUs && version) {
            deleteTag(version);
          }
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
            // Rollback tag if we created it
            if (tagCreatedByUs && version) {
              deleteTag(version);
            }
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
