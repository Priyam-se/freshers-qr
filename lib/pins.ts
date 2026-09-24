import { supabase } from "./supabase";

export async function getScannerPins(): Promise<{ entryPin: string; foodPin: string }> {
  try {
    const { data } = await supabase.from("config").select("key, value");

    if (data && data.length > 0) {
      const entryRow = data.find((r) => r.key === "entryPin");
      const foodRow = data.find((r) => r.key === "foodPin");

      return {
        entryPin: entryRow?.value || process.env.ENTRY_PIN_DEFAULT || "1234",
        foodPin: foodRow?.value || process.env.FOOD_PIN_DEFAULT || "5678",
      };
    }
  } catch (err) {
    console.warn("Could not load PINs from Supabase, using defaults:", err);
  }

  return {
    entryPin: process.env.ENTRY_PIN_DEFAULT || "1234",
    foodPin: process.env.FOOD_PIN_DEFAULT || "5678",
  };
}

export async function updateScannerPins(entryPin: string, foodPin: string): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    await supabase.from("config").upsert([
      { key: "entryPin", value: entryPin, updated_at: now },
      { key: "foodPin", value: foodPin, updated_at: now },
    ]);
    return true;
  } catch (err) {
    console.error("Failed to update scanner PINs in Supabase:", err);
    return false;
  }
}
