jest.mock("../../api/client", () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
}));

const client = require("../../api/client");
const {
  fetchClientVouchers,
  applyClientVoucherToAppointment,
} = require("../clientBooking");

describe("clientBooking vouchers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchClientVouchers", () => {
    it("calls GET clients/me/vouchers/ and returns the array as-is", async () => {
      const vouchers = [
        { id: 1, voucher_code: "ABC", status: "active" },
      ];
      client.get.mockResolvedValue({ data: vouchers });

      const result = await fetchClientVouchers();

      expect(client.get).toHaveBeenCalledWith("clients/me/vouchers/");
      expect(result).toEqual(vouchers);
    });

    it("returns an empty array if the backend does not return an array", async () => {
      client.get.mockResolvedValue({ data: null });
      const result = await fetchClientVouchers();
      expect(result).toEqual([]);
    });
  });

  describe("applyClientVoucherToAppointment", () => {
    it("posts the client_voucher_id to the apply-voucher endpoint for the given appointment", async () => {
      const updatedVoucher = { id: 1, status: "used" };
      client.post.mockResolvedValue({ data: updatedVoucher });

      const result = await applyClientVoucherToAppointment(42, 1);

      expect(client.post).toHaveBeenCalledWith(
        "clients/me/appointments/42/apply-voucher/",
        { client_voucher_id: 1 }
      );
      expect(result).toEqual(updatedVoucher);
    });

    it("propagates errors from the backend (e.g. already used voucher)", async () => {
      const error = {
        response: { data: { client_voucher_id: ["Este voucher já foi usado."] } },
      };
      client.post.mockRejectedValue(error);

      await expect(applyClientVoucherToAppointment(42, 1)).rejects.toBe(error);
    });
  });
});
