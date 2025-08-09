import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getErrorMessage } from "@/utils/utils";

export async function createFirmAction(firmName: string) {
  const supabase = await createSupabaseServerClient();

  const data = {
    firmName,
  };

  const { error } = await supabase.from("firms").insert([data]);

  if (error) {
    return { errorMessage: getErrorMessage(error) };
  }

  return { errorMessage: null };
}
