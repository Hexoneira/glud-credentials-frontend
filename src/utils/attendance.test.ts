import { describe, expect, it } from "vitest";
import { extractCodigoFromScan, extractTotpFromScan } from "./attendance";

describe("extractCodigoFromScan", () => {
  it("acepta un código plano", () => {
    expect(extractCodigoFromScan("20210000001")).toBe("20210000001");
  });

  it("acepta códigos de invitado", () => {
    expect(extractCodigoFromScan("guest-e2e")).toBe("guest-e2e");
  });

  it("extrae el código del payload QR del carnet", () => {
    expect(extractCodigoFromScan("ID:20210000001|TOTP:123456")).toBe("20210000001");
  });

  it("trimea espacios", () => {
    expect(extractCodigoFromScan("  20210000001  ")).toBe("20210000001");
  });

  it("devuelve null para null/undefined", () => {
    expect(extractCodigoFromScan(null as unknown as string)).toBeNull();
    expect(extractCodigoFromScan(undefined as unknown as string)).toBeNull();
  });

  it("devuelve null para contenido vacío", () => {
    expect(extractCodigoFromScan("")).toBeNull();
  });

  it("devuelve null para contenido desconocido", () => {
    expect(extractCodigoFromScan("https://example.com/qr")).toBeNull();
    expect(extractCodigoFromScan("ID:20210000001")).toBeNull();
    expect(extractCodigoFromScan("ab")).toBeNull();
    expect(extractCodigoFromScan("código con acentos")).toBeNull();
  });
});

describe("extractTotpFromScan", () => {
  it("extrae el TOTP del payload QR del carnet", () => {
    expect(extractTotpFromScan("ID:20210000001|TOTP:123456")).toBe("123456");
  });

  it("devuelve null para un código plano", () => {
    expect(extractTotpFromScan("20210000001")).toBeNull();
  });

  it("devuelve null si el TOTP no tiene 6 dígitos", () => {
    expect(extractTotpFromScan("ID:20210000001|TOTP:12")).toBeNull();
    expect(extractTotpFromScan("ID:20210000001|TOTP:1234567")).toBeNull();
  });

  it("devuelve null para contenido vacío o desconocido", () => {
    expect(extractTotpFromScan("")).toBeNull();
    expect(extractTotpFromScan("https://example.com/qr")).toBeNull();
    expect(extractTotpFromScan(null as unknown as string)).toBeNull();
  });
});
