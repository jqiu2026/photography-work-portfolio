import { describe, expect, it } from "vitest";
import { checkEmail, isDisposableDomain } from "../src/email-check";

describe("email checks", () => {
  it("accepts ordinary addresses, including other people's own domains", () => {
    for (const e of [
      "a@gmail.com",
      "jerry@jerryqiu.com",
      "first.last+tag@school.edu",
      "me@mail.example.co.uk",
      "x@nus.edu.sg",
    ])
      expect(checkEmail(e)).toEqual({ ok: true });
  });
  it("refuses a bad shape", () => {
    for (const e of ["", "nope", "a@b", "a b@c.com", "a@@c.com", "a@c.com, d@e.com", "<a@c.com>"])
      expect(checkEmail(e)).toMatchObject({ ok: false, reason: "shape" });
  });
  it("refuses throwaway-mailbox domains, in any case, and their subdomains", () => {
    for (const e of [
      "x@mailinator.com",
      "X@MAILINATOR.COM",
      "a@10minutemail.com",
      "a@guerrillamail.com",
      "a@yopmail.com",
      "a@sub.mailinator.com",
      "a@temp-mail.org",
      "a@sharklasers.com",
    ])
      expect(checkEmail(e)).toMatchObject({ ok: false, reason: "disposable" });
  });
  it("does not block real providers that only look similar", () => {
    expect(isDisposableDomain("gmail.com")).toBe(false);
    expect(isDisposableDomain("mail.com")).toBe(false);
    expect(isDisposableDomain("mailinator.com.example.org")).toBe(false);
    expect(isDisposableDomain("protonmail.com")).toBe(false);
  });
});
