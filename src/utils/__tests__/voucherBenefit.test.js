import { describeVoucherBenefit } from "../voucherBenefit";

describe("describeVoucherBenefit", () => {
  it("describes a percent voucher in Portuguese", () => {
    expect(
      describeVoucherBenefit({ voucher_type: "percent", voucher_value: "20.00" }, "pt")
    ).toBe("20.00% de desconto");
  });

  it("describes a percent voucher in English", () => {
    expect(
      describeVoucherBenefit({ voucher_type: "percent", voucher_value: "20.00" }, "en")
    ).toBe("20.00% discount");
  });

  it("describes a fixed-value voucher in Portuguese", () => {
    expect(
      describeVoucherBenefit({ voucher_type: "fixed", voucher_value: "5.00" }, "pt")
    ).toBe("Desconto de 5.00");
  });

  it("describes a fixed-value voucher in English", () => {
    expect(
      describeVoucherBenefit({ voucher_type: "fixed", voucher_value: "5.00" }, "en")
    ).toBe("5.00 discount");
  });

  it("describes a free_service voucher generically (backend does not return the service name)", () => {
    expect(
      describeVoucherBenefit({ voucher_type: "free_service", voucher_value: null }, "pt")
    ).toBe("Serviço grátis");
    expect(
      describeVoucherBenefit({ voucher_type: "free_service", voucher_value: null }, "en")
    ).toBe("Free service");
  });

  it("defaults to Portuguese when no language is given", () => {
    expect(
      describeVoucherBenefit({ voucher_type: "free_service" })
    ).toBe("Serviço grátis");
  });
});
