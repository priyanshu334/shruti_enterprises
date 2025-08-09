"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getErrorMessage } from "@/utils/utils";

export async function loginAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { errorMessage: getErrorMessage(error) };
  }

  return { errorMessage: null };
}

export async function signupAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    return { errorMessage: getErrorMessage(error) };
  }

  return { errorMessage: null };
}
