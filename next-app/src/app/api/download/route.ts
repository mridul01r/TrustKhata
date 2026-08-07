import { NextResponse } from "next/server";

// Owner/repo of the TrustKhata GitHub repository. Update if the repo
// is ever renamed or moved.
const GITHUB_OWNER = "mridul01r";
const GITHUB_REPO = "TrustKhata";

/**
 * GET /api/download
 *
 * Always redirects to whatever .exe asset is attached to the CURRENT
 * "latest" GitHub Release - so this URL never needs to change even as
 * the installer's filename changes with every version bump
 * (desktop-shell_0.1.2_x64-setup.exe -> 0.1.3 -> ...).
 *
 * The download button on the website should always point here, never
 * directly at a GitHub asset URL.
 */
export async function GET() {
  try {
    const releaseRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      {
        headers: { Accept: "application/vnd.github+json" },
        // Revalidate periodically rather than caching forever, so a new
        // release becomes the download target within a reasonable time.
        next: { revalidate: 300 },
      }
    );

    if (!releaseRes.ok) {
      console.error(
        `GitHub releases API returned ${releaseRes.status} for latest release`
      );
      return NextResponse.redirect(
        `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
        { status: 302 }
      );
    }

    const release = await releaseRes.json();
    const exeAsset = (release.assets || []).find((asset: { name: string }) =>
      asset.name.toLowerCase().endsWith("-setup.exe")
    );

    if (!exeAsset) {
      console.error("No .exe installer asset found on the latest release");
      return NextResponse.redirect(
        `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
        { status: 302 }
      );
    }

    return NextResponse.redirect(exeAsset.browser_download_url, {
      status: 302,
    });
  } catch (err) {
    console.error("Failed to resolve latest release download URL:", err);
    // Fall back to the human-readable releases page rather than
    // showing the visitor a broken link.
    return NextResponse.redirect(
      `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      { status: 302 }
    );
  }
}