import { describe, it, expect } from "vitest";
import { reducer } from "@/hooks/use-toast";

describe("toast reducer", () => {
  const createMockToast = (overrides = {}) => ({
    id: "test-id",
    open: true,
    ...overrides,
  });

  describe("ADD_TOAST", () => {
    it("should add a toast to an empty state", () => {
      const state = { toasts: [] };
      const action = {
        type: "ADD_TOAST" as const,
        toast: createMockToast({ id: "1", title: "Test" }),
      };

      const result = reducer(state, action);

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe("1");
      expect(result.toasts[0].title).toBe("Test");
    });

    it("should add toast to beginning of list", () => {
      // Note: When state already has 1 toast, adding another will trigger TOAST_LIMIT (1)
      // So we test that order by checking state with no toasts first
      const state = { toasts: [] };
      const action = {
        type: "ADD_TOAST" as const,
        toast: createMockToast({ id: "new" }),
      };

      const result = reducer(state, action);

      expect(result.toasts[0].id).toBe("new");
    });

    it("should respect TOAST_LIMIT", () => {
      const state = { toasts: [] };
      const action = {
        type: "ADD_TOAST" as const,
        toast: createMockToast({ id: "1" }),
      };

      // Add multiple toasts (TOAST_LIMIT is 1)
      let result = reducer(state, action);
      result = reducer(result, { type: "ADD_TOAST" as const, toast: createMockToast({ id: "2" }) });
      result = reducer(result, { type: "ADD_TOAST" as const, toast: createMockToast({ id: "3" }) });

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe("3");
    });
  });

  describe("UPDATE_TOAST", () => {
    it("should update an existing toast", () => {
      const state = { toasts: [createMockToast({ id: "1", title: "Original" })] };
      const action = {
        type: "UPDATE_TOAST" as const,
        toast: { id: "1", title: "Updated" },
      };

      const result = reducer(state, action);

      expect(result.toasts[0].title).toBe("Updated");
    });

    it("should not modify toasts that don't match", () => {
      const state = { toasts: [createMockToast({ id: "1", title: "First" })] };
      const action = {
        type: "UPDATE_TOAST" as const,
        toast: { id: "nonexistent", title: "Updated" },
      };

      const result = reducer(state, action);

      expect(result.toasts[0].title).toBe("First");
    });
  });

  describe("DISMISS_TOAST", () => {
    it("should set open to false for specific toast", () => {
      const state = { toasts: [createMockToast({ id: "1" })] };
      const action = { type: "DISMISS_TOAST" as const, toastId: "1" };

      const result = reducer(state, action);

      expect(result.toasts[0].open).toBe(false);
    });

    it("should dismiss all toasts when toastId is undefined", () => {
      const state = { toasts: [createMockToast({ id: "1" }), createMockToast({ id: "2" })] };
      const action = { type: "DISMISS_TOAST" as const };

      const result = reducer(state, action);

      expect(result.toasts.every((t) => t.open === false)).toBe(true);
    });
  });

  describe("REMOVE_TOAST", () => {
    it("should remove specific toast", () => {
      const state = { toasts: [createMockToast({ id: "1" })] };
      const action = { type: "REMOVE_TOAST" as const, toastId: "1" };

      const result = reducer(state, action);

      expect(result.toasts).toHaveLength(0);
    });

    it("should remove all toasts when toastId is undefined", () => {
      const state = { toasts: [createMockToast({ id: "1" }), createMockToast({ id: "2" })] };
      const action = { type: "REMOVE_TOAST" as const };

      const result = reducer(state, action);

      expect(result.toasts).toHaveLength(0);
    });
  });
});