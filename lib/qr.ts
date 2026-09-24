import QRCode from "qrcode";

export async function generateQRCodeDataURL(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: "H",
    margin: 2,
    scale: 8,
    color: {
      dark: "#0f172a", // Slate 900
      light: "#ffffff",
    },
  });
}

export async function generateQRCodeBuffer(data: string): Promise<Buffer> {
  return QRCode.toBuffer(data, {
    errorCorrectionLevel: "H",
    margin: 2,
    scale: 8,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}
