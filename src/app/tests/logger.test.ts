import path from "path";
import winston from "winston";

describe("Logger configuration", () => {
  const originalEnv = process.env.NODE_ENV;

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
    jest.resetModules();
  });

  test("should set level to info in production", () => {
    process.env.NODE_ENV = "production";
    jest.resetModules(); // clear import cache
    const logger = require("../../lib/logger").default;
    expect(logger.level).toBe("info");
    // transports count
    expect(logger.transports).toHaveLength(3);
    expect(logger.transports[0]).toBeInstanceOf(winston.transports.Console);
    expect(logger.transports[1]).toBeInstanceOf(winston.transports.File);
    expect(logger.transports[2]).toBeInstanceOf(winston.transports.File);
    // Verify file paths
    const errorTransport = logger.transports[1] as winston.transports.FileTransportInstance;
    const combinedTransport = logger.transports[2] as winston.transports.FileTransportInstance;
    expect(errorTransport.filename).toBe("error.log");
    expect(combinedTransport.filename).toBe("combined.log");
  });

  test("should set level to debug when not production", () => {
    process.env.NODE_ENV = "development";
    jest.resetModules();
    const logger = require("../../lib/logger").default;
    expect(logger.level).toBe("debug");
  });
});
