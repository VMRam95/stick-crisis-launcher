import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { execSync } from "child_process";
import * as path from "path";

// Path to the stick-crisis game repository
const STICK_CRISIS_REPO = path.resolve(process.cwd(), "../stick-crisis");

interface CreateTagInput {
  version: string;
  message?: string;
}

interface CreateTagOutput {
  success: boolean;
  tag?: string;
  error?: string;
  pushed?: boolean;
}

// POST - Create and push a new tag
export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await isAdminAuthenticated();
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateTagInput = await request.json();
    const { version, message } = body;

    if (!version) {
      return NextResponse.json(
        { error: "Version is required" },
        { status: 400 }
      );
    }

    // Ensure version starts with 'v'
    const tagName = version.startsWith("v") ? version : `v${version}`;
    const tagMessage = message || `Release ${tagName}`;

    // Check if tag already exists
    try {
      execSync(`git rev-parse ${tagName}`, {
        cwd: STICK_CRISIS_REPO,
        encoding: "utf-8",
        stdio: "pipe",
      });
      // Tag exists
      return NextResponse.json(
        { error: `Tag ${tagName} already exists` },
        { status: 409 }
      );
    } catch {
      // Tag doesn't exist, good to proceed
    }

    // Fetch latest to ensure we're up to date
    try {
      execSync("git fetch origin --tags", {
        cwd: STICK_CRISIS_REPO,
        encoding: "utf-8",
        stdio: "pipe",
      });
    } catch (error) {
      console.error("Failed to fetch:", error);
    }

    // Create annotated tag at origin/develop
    try {
      execSync(
        `git tag -a ${tagName} origin/develop -m "${tagMessage}"`,
        {
          cwd: STICK_CRISIS_REPO,
          encoding: "utf-8",
          stdio: "pipe",
        }
      );
    } catch (error) {
      const result: CreateTagOutput = {
        success: false,
        error: `Failed to create tag: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      return NextResponse.json(result, { status: 500 });
    }

    // Push tag to remote
    let pushed = false;
    try {
      execSync(`git push origin ${tagName}`, {
        cwd: STICK_CRISIS_REPO,
        encoding: "utf-8",
        stdio: "pipe",
      });
      pushed = true;
    } catch (error) {
      console.error("Failed to push tag:", error);
      // Tag was created locally but not pushed
      // Delete the local tag to avoid inconsistency
      try {
        execSync(`git tag -d ${tagName}`, {
          cwd: STICK_CRISIS_REPO,
          encoding: "utf-8",
          stdio: "pipe",
        });
      } catch {
        // Ignore cleanup errors
      }

      const result: CreateTagOutput = {
        success: false,
        tag: tagName,
        error: `Tag created but failed to push: ${error instanceof Error ? error.message : "Unknown error"}`,
        pushed: false,
      };
      return NextResponse.json(result, { status: 500 });
    }

    const result: CreateTagOutput = {
      success: true,
      tag: tagName,
      pushed,
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Create tag error:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to create tag: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
