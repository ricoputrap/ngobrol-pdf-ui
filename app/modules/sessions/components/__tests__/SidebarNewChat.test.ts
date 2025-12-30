/**
 * SidebarNewChat Component Tests
 *
 * Tests for the SidebarNewChat component including:
 * - Component structure validation
 * - Button content and styling
 * - Accessibility attributes
 * - Navigation behavior
 * - Dark mode support
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import SidebarNewChat from "../SidebarNewChat.vue";

describe("SidebarNewChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    return mount(SidebarNewChat);
  };

  describe("Component Structure", () => {
    it("should render the component", () => {
      const wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });

    it("should have a container with border styling", () => {
      const wrapper = createWrapper();
      const container = wrapper.find("div");
      expect(container.classes()).toContain("border-t");
      expect(container.classes()).toContain("border-gray-200");
      expect(container.classes()).toContain("dark:border-gray-700");
      expect(container.classes()).toContain("p-4");
    });

    it("should render a button element", () => {
      const wrapper = createWrapper();
      const button = wrapper.find("button");
      expect(button.exists()).toBe(true);
      expect(button.attributes("type")).toBe("button");
    });

    it("should have proper button styling", () => {
      const wrapper = createWrapper();
      const button = wrapper.find("button");
      expect(button.classes()).toContain("w-full");
      expect(button.classes()).toContain("flex");
      expect(button.classes()).toContain("items-center");
      expect(button.classes()).toContain("justify-center");
      expect(button.classes()).toContain("bg-blue-600");
      expect(button.classes()).toContain("hover:bg-blue-700");
      expect(button.classes()).toContain("text-white");
      expect(button.classes()).toContain("rounded-lg");
    });
  });

  describe("Button Content", () => {
    it('should display "New Chat" text', () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain("New Chat");
    });

    it("should render a plus icon SVG", () => {
      const wrapper = createWrapper();
      const svg = wrapper.find("svg");
      expect(svg.exists()).toBe(true);
      expect(svg.classes()).toContain("w-5");
      expect(svg.classes()).toContain("h-5");
      expect(svg.attributes("aria-hidden")).toBe("true");
    });

    it("should have correct SVG path for plus icon", () => {
      const wrapper = createWrapper();
      const path = wrapper.find("path");
      expect(path.exists()).toBe(true);
      expect(path.attributes("d")).toBe("M12 4v16m8-8H4");
    });
  });

  describe("Accessibility", () => {
    it("should have aria-label on button", () => {
      const wrapper = createWrapper();
      const button = wrapper.find("button");
      expect(button.attributes("aria-label")).toBe("Start a new chat");
    });

    it("should have aria-hidden on icon SVG", () => {
      const wrapper = createWrapper();
      const svg = wrapper.find("svg");
      expect(svg.attributes("aria-hidden")).toBe("true");
    });

    it("should have focus ring styles", () => {
      const wrapper = createWrapper();
      const button = wrapper.find("button");
      expect(button.classes()).toContain("focus:outline-none");
      expect(button.classes()).toContain("focus:ring-2");
      expect(button.classes()).toContain("focus:ring-blue-500");
    });
  });

  describe("Navigation Behavior", () => {
    it("should navigate to home page on click", async () => {
      const wrapper = createWrapper();
      const button = wrapper.find("button");

      await button.trigger("click");
      await wrapper.vm.$nextTick();

      // useRouter is mocked globally in vitest.setup.ts
      const mockRouter = (globalThis as any).useRouter();
      expect(mockRouter.push).toHaveBeenCalledWith("/");
    });

    it("should call router.push on button click", async () => {
      const wrapper = createWrapper();
      const button = wrapper.find("button");

      await button.trigger("click");

      const mockRouter = (globalThis as any).useRouter();
      expect(mockRouter.push).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple clicks", async () => {
      const wrapper = createWrapper();
      const button = wrapper.find("button");

      await button.trigger("click");
      await button.trigger("click");
      await button.trigger("click");

      const mockRouter = (globalThis as any).useRouter();
      expect(mockRouter.push).toHaveBeenCalledTimes(3);
    });
  });

  describe("Dark Mode Support", () => {
    it("should have dark mode border classes", () => {
      const wrapper = createWrapper();
      const container = wrapper.find("div");
      expect(container.classes()).toContain("dark:border-gray-700");
    });

    it("should have dark mode focus ring offset", () => {
      const wrapper = createWrapper();
      const button = wrapper.find("button");
      expect(button.classes()).toContain("dark:focus:ring-offset-gray-800");
    });
  });

  describe("Styling and Layout", () => {
    it("should have transition effects", () => {
      const wrapper = createWrapper();
      const button = wrapper.find("button");
      expect(button.classes()).toContain("transition-colors");
      expect(button.classes()).toContain("duration-200");
    });

    it("should have proper spacing between icon and text", () => {
      const wrapper = createWrapper();
      const button = wrapper.find("button");
      expect(button.classes()).toContain("gap-2");
    });

    it("should have proper padding", () => {
      const wrapper = createWrapper();
      const button = wrapper.find("button");
      expect(button.classes()).toContain("px-4");
      expect(button.classes()).toContain("py-3");
    });
  });

  describe("Button States", () => {
    it("should have hover state styling", () => {
      const wrapper = createWrapper();
      const button = wrapper.find("button");
      expect(button.classes()).toContain("hover:bg-blue-700");
    });

    it("should be a full-width button", () => {
      const wrapper = createWrapper();
      const button = wrapper.find("button");
      expect(button.classes()).toContain("w-full");
    });
  });
});
