import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("should merge class names", () => {
    const result = cn("foo", "bar");
    expect(result).toBe("foo bar");
  });

  it("should handle empty inputs", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should handle clsx objects", () => {
    const result = cn({ "foo-bar": true, "baz-qux": false });
    expect(result).toBe("foo-bar");
  });

  it("should handle mixed inputs", () => {
    const result = cn("foo", { bar: true, baz: false });
    expect(result).toBe("foo bar");
  });

  it("should handle tailwind-merge conflicts", () => {
    // tailwind-merge should merge conflicting classes
    const result = cn("px-2 px-4");
    expect(result).toBe("px-4");
  });
});
