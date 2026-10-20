// Netlify Forms with a static export: the forms are declared in public/__forms.html
// and submissions are posted there.
export async function submitNetlifyForm(form: HTMLFormElement) {
  const body = new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString();
  const res = await fetch("/__forms.html", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Form submit failed: ${res.status}`);
}
