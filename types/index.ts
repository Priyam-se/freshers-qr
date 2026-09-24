export interface Student {
  _id?: string;
  name: string;
  email: string;
  rollNo: string;
  qrToken: string;
  emailSent: boolean;
  entryScanned: boolean;
  entryScannedAt: Date | string | null;
  entryScannedBy: string;
  foodScanned: boolean;
  foodScannedAt: Date | string | null;
  foodScannedBy: string;
  createdAt: Date | string;
  lastUpdatedAt: Date | string;
}

export interface ScanResult {
  status: "success" | "already_scanned" | "invalid";
  name?: string;
  rollNo?: string;
  scannedAt?: string;
  message?: string;
}

export interface AdminStats {
  total: number;
  entryCount: number;
  foodCount: number;
}

export interface ScannerPins {
  entryPin: string;
  foodPin: string;
}

export type ScannerType = "entry" | "food";
