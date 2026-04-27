import { describe, expect, test } from "vitest";

import { getArtifactPrimaryEffectType, mapArtifactExposureToEffectTypes } from "./contracts";

describe("artifact exposure mapping", () => {
  test("maps artifact-only config", () => {
    expect(
      getArtifactPrimaryEffectType({
        artifactId: "artifact:x",
        tag: "x",
        title: "X",
        format: "markdown",
        persistence: "run_only",
        writeMode: "replace",
        history: { enabled: true, maxItems: 20 },
        exposures: [],
      })
    ).toBe("artifact.upsert");
  });

  test("maps turn rewrite exposures for both targets", () => {
    expect(
      mapArtifactExposureToEffectTypes({
        artifactId: "artifact:x",
        tag: "x",
        title: "X",
        format: "markdown",
        persistence: "run_only",
        writeMode: "replace",
        history: { enabled: true, maxItems: 20 },
        exposures: [{ type: "turn_rewrite", target: "assistant_output_main", mode: "replace" }],
      })
    ).toEqual(["artifact.upsert", "turn.assistant.replace_text"]);

    expect(
      mapArtifactExposureToEffectTypes({
        artifactId: "artifact:x",
        tag: "x",
        title: "X",
        format: "markdown",
        persistence: "run_only",
        writeMode: "replace",
        history: { enabled: true, maxItems: 20 },
        exposures: [{ type: "turn_rewrite", target: "current_user_main", mode: "replace" }],
      })
    ).toEqual(["artifact.upsert", "turn.user.replace_text"]);
  });

  test("maps prompt and ui exposure kinds", () => {
    expect(
      mapArtifactExposureToEffectTypes({
        artifactId: "artifact:x",
        tag: "x",
        title: "X",
        format: "markdown",
        persistence: "run_only",
        writeMode: "replace",
        history: { enabled: true, maxItems: 20 },
        exposures: [{ type: "prompt_part", target: "system", mode: "append" }],
      })
    ).toEqual(["artifact.upsert", "prompt.system_update"]);

    expect(
      mapArtifactExposureToEffectTypes({
        artifactId: "artifact:x",
        tag: "x",
        title: "X",
        format: "markdown",
        persistence: "run_only",
        writeMode: "replace",
        history: { enabled: true, maxItems: 20 },
        exposures: [{ type: "prompt_message", role: "system", anchor: "after_last_user" }],
      })
    ).toEqual(["artifact.upsert", "prompt.append_after_last_user"]);

    expect(
      mapArtifactExposureToEffectTypes({
        artifactId: "artifact:x",
        tag: "x",
        title: "X",
        format: "markdown",
        persistence: "run_only",
        writeMode: "replace",
        history: { enabled: true, maxItems: 20 },
        exposures: [
          { type: "prompt_message", role: "assistant", anchor: "depth_from_end", depthFromEnd: 1 },
          { type: "ui_inline", role: "assistant", anchor: "after_last_user" },
        ],
      })
    ).toEqual(["artifact.upsert", "prompt.insert_at_depth", "ui.inline"]);
  });
});
