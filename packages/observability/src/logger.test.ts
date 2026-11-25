import { afterEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "./logger.js";
import { REDACTED } from "./redact.js";

describe("createLogger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env["LOG_LEVEL"];
  });

  it("emits single-line JSON with redacted metadata to stdout and stderr", () => {
    process.env["LOG_LEVEL"] = "debug";
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    const logger = createLogger({ service: "web", module: "auth" }).child({ requestId: "req_1" });
    logger.info("user signed in", { token: "secret-tok", count: 2 });
    logger.error("webhook failed", { authorization: "Bearer mytoken123" });

    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const infoLine = JSON.parse(String(stdoutSpy.mock.calls[0]?.[0])) as Record<string, unknown>;
    expect(infoLine["level"]).toBe("info");
    expect(infoLine["service"]).toBe("web");
    expect(infoLine["module"]).toBe("auth");
    expect(infoLine["requestId"]).toBe("req_1");
    expect(infoLine["token"]).toBe(REDACTED);
    expect(infoLine["count"]).toBe(2);

    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const errLine = JSON.parse(String(stderrSpy.mock.calls[0]?.[0])) as Record<string, unknown>;
    expect(errLine["level"]).toBe("error");
    expect(errLine["authorization"]).toBe(REDACTED);
  });
});
